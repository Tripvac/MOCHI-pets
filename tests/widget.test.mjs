import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {fresh,act,progress,H} from "../shared/game.mjs";
import {widgetDocument} from "../shared/widget.mjs";
import {companionIds} from "../shared/companions.mjs";
import {parseDocument,validateDocument,widgetState,preferences} from "../phone-widget/src/core.mjs";

const now=Date.now();
function pet(species="pusheen") {
  let state=act(fresh(now),{type:"adopt",species,name:"Наш друг"},now);
  Object.assign(state,{food:65,energy:52,joy:78});
  return act(state,{type:"sleep"},now);
}
test("widget forecasts use the game rules and export no inventory, wallet or history",()=>{
  for(const species of companionIds) {
    const state=pet(species),before=structuredClone(state),document=widgetDocument(state,now);
    assert.equal(document.frames.length,61);
    assert.ok(validateDocument(document,now));
    assert.equal(document.frames.at(-1).at,now+48*H);
    for(const frame of document.frames) {
      const expected=progress(state,frame.at);
      for(const field of ["food","energy","joy"])assert.equal(frame[field],Math.round(expected[field]));
      assert.equal(frame.sleeping,expected.sleeping);
    }
    assert.deepEqual(state,before);
    for(const secret of ["inventory","coins","history","claims","settings","code"])assert.equal(document[secret],undefined);
  }
});
test("phone widget imports reject bad values, unknown pets, duplicate timestamps and invalid images",()=>{
  const document=widgetDocument(pet(),now);
  for(const mutate of [d=>d.frames[0].food=101,d=>d.frames[0].energy=NaN,d=>d.species="unknown",d=>d.frames[1].at=d.frames[0].at,d=>d.portraits={awake:"no",asleep:"no"},d=>d.frames=[]]) {
    const invalid=structuredClone(document);mutate(invalid);
    assert.equal(validateDocument(invalid,now),false);
  }
  assert.throws(()=>parseDocument("not JSON",now));
  assert.ok(parseDocument(JSON.stringify(document),now));
});
test("phone widgets never invent needs for a different animal or expired snapshot",()=>{
  const document=widgetDocument(pet(),now);
  const current=widgetState(document,preferences(null),"needs",now+H);
  assert.equal(current.mode,"needs");assert.equal(current.frame.food,64);assert.equal(current.frame.energy,65);
  const other=widgetState(document,preferences(null),"cat,needs",now);
  assert.equal(other.species,"cat");assert.equal(other.frame,null);assert.equal(other.hasData,false);
  const stale=widgetState(document,preferences(null),"needs",now+49*H);
  assert.equal(stale.stale,true);assert.equal(stale.frame,null);
});

function host(document=null,parameter="pet",family="small") {
  const allText=[],images=[],output={};
  class Node {
    constructor(){this.children=[];}
    addStack(){const child=new Node();this.children.push(child);return child;}
    addText(value){allText.push(String(value));const node={centerAlignText(){}};this.children.push(node);return node;}
    addImage(value){images.push(value);const image={applyFittingContentMode(){}};this.children.push(image);return image;}
    addSpacer(){} layoutHorizontally(){} layoutVertically(){} centerAlignContent(){} setPadding(){}
  }
  const paths=new Map(document?[["/local/MOCHI-Widget/state.json",JSON.stringify(document)]]:[]);
  const sandbox={
    __output:output,ListWidget:Node,Size:class{constructor(width,height){this.width=width;this.height=height;}},Rect:class{},Color:class{},
    DrawContext:class{setFillColor(){}fillRect(){}getImage(){return{meter:true}}},
    Font:{systemFont:n=>n,mediumSystemFont:n=>n,boldSystemFont:n=>n},
    Data:{fromBase64String:value=>Buffer.from(value,"base64")},
    Image:{fromData(value){assert.equal(value.subarray(0,8).toString("hex"),"89504e470d0a1a0a");return value;}},
    FileManager:{local:()=>({documentsDirectory:()=>"/local",joinPath:(a,b)=>a+"/"+b,fileExists:path=>paths.has(path),createDirectory(){},readString:path=>{if(!paths.has(path))throw Error("No file");return paths.get(path)},writeString:(path,value)=>paths.set(path,value)})},
    args:{widgetParameter:parameter,plainTexts:[],fileURLs:[]},config:{runsInWidget:true,widgetFamily:family},
    Script:{setWidget(widget){output.widget=widget},complete(){output.complete=true}},
    Pasteboard:{pasteString(){throw Error("Background widgets must not read the clipboard")}},
  };
  return {sandbox,allText,images,output};
}
const installer=()=>JSON.parse(fs.readFileSync(new URL("../public/widgets/MOCHI.scriptable",import.meta.url),"utf8"));
async function runWidget(options){
  const data=installer();assert.equal(data.name,"MOCHI");assert.equal(data.always_run_in_app,false);
  const code=new vm.Script("(async()=>{\n"+data.script+"\n})()",{filename:"MOCHI.scriptable"});
  await code.runInNewContext(options.sandbox,{timeout:10000});
  assert.equal(options.output.complete,true);assert.ok(options.output.widget);
}
test("the installable script builds offline phone widgets for every pet and never reads the clipboard in the background",async()=>{
  for(const species of companionIds)for(const family of ["small","medium"]) {
    const context=host(null,species,family);await runWidget(context);
    assert.ok(context.images.length>0);
    assert.ok(!context.allText.some(text=>text.endsWith("%")));
  }
  const empty=host(null,"needs");await runWidget(empty);
  assert.ok(empty.allText.includes("Еда")&&empty.allText.includes("Сон")&&empty.allText.includes("Игры"));
  assert.equal(empty.allText.filter(t=>t==="—").length,3);
});
test("the installable needs widget renders imported game values and the selected pet's real name",async()=>{
  const document=widgetDocument(pet("rabbit"),Date.now());
  const context=host(document,"needs");await runWidget(context);
  assert.ok(context.allText.includes("Наш друг"));
  assert.ok(context.allText.includes("65%"));
  assert.ok(context.allText.includes("52%"));
  assert.ok(context.allText.includes("78%"));
});
