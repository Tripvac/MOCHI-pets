// Produce an offline Scriptable import file and plain JS, with all pets embedded.
import fs from "node:fs";
import path from "node:path";
import {build} from "vite";
const root=process.cwd(), assets={};
for(const name of fs.readdirSync("phone-widget/assets")) {
  if(name.endsWith(".png")) assets[name.slice(0,-4)]=fs.readFileSync(path.join("phone-widget/assets",name)).toString("base64");
}
if(Object.keys(assets).length!==14) throw Error("The phone widget requires fourteen bundled pet portraits.");
const result=await build({configFile:false,publicDir:false,logLevel:"warn",define:{__MOCHI_WIDGET_ASSETS__:JSON.stringify(assets)},build:{write:false,target:"es2020",minify:false,lib:{entry:path.resolve("phone-widget/src/main.mjs"),name:"MochiPhoneWidget",formats:["iife"]},rollupOptions:{output:{inlineDynamicImports:true}}}});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).filter(x=>x.type==="chunk").map(x=>x.code).join("\n");
const script="// Variables used by Scriptable.\n// icon-color: deep-blue; icon-glyph: paw;\n"+output+"\nawait MochiPhoneWidget.run();\n";
const installer={always_run_in_app:false,icon:{color:"deep-blue",glyph:"paw"},name:"MOCHI",script,share_sheet_inputs:["file-url","plain-text"]};
fs.mkdirSync("public/widgets",{recursive:true});
fs.writeFileSync("public/widgets/MOCHI.js",script);
fs.writeFileSync("public/widgets/MOCHI.scriptable",JSON.stringify(installer));
console.log(JSON.stringify({file:"public/widgets/MOCHI.scriptable",bytes:fs.statSync("public/widgets/MOCHI.scriptable").size,embeddedPortraits:Object.keys(assets).length}));
