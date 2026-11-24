import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
let version = 0;

async function audioHarness({deferred=false}={}) {
  const stats = {requests: [], starts: [], stops: [], contexts: 0};
  const waiting = [];
  const listeners = new Map();
  globalThis.document = {hidden:false,addEventListener(name,fn){listeners.set(name,fn)}};
  globalThis.window = {AudioContext: class {
    constructor(){this.state="running";this.currentTime=0;stats.contexts++;}
    async resume(){this.state="running";}
    async decodeAudioData(){return {duration:1};}
    createBufferSource(){
      const node={connect(){},disconnect(){},start(){stats.starts.push(node)},stop(){stats.stops.push(node)}};
      return node;
    }
    createGain(){return {gain:{value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
  }};
  globalThis.fetch = async url => {
    stats.requests.push(url);
    if(deferred) await new Promise(resolve=>waiting.push(resolve));
    return {ok:true,async arrayBuffer(){return new ArrayBuffer(44)}};
  };
  let source=fs.readFileSync(new URL("../src/audio.ts",import.meta.url),"utf8");
  source=source.replace('import { assetUrl } from "./assets";', 'const assetUrl = (value: string) => value;');
  source=source.replace('"../shared/companion-behavior.mjs"',JSON.stringify(new URL("../shared/companion-behavior.mjs",import.meta.url).href));
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  const api=await import("data:text/javascript;base64,"+Buffer.from(js+"\n//case "+version++).toString("base64"));
  const prefs={sound:true,volume:.65,ambience:false,active:true,weather:"clear",night:false,species:"cat"};
  api.configureAudio(prefs);
  return {api,stats,prefs,waiting,listeners};
}

test("muted and zero-volume voices do not create an audio context or fetch clips", async () => {
  const {api,stats,prefs}=await audioHarness();
  api.configureAudio({...prefs,sound:false});
  assert.equal(await api.playCompanionVoice("cat","love",true),false);
  api.configureAudio({...prefs,volume:0});
  assert.equal(await api.playCompanionVoice("cat","love",true),false);
  assert.equal(stats.contexts,0);
  assert.equal(stats.requests.length,0);
});

test("repeat care alternates voice takes and fades the previous voice instead of stacking", async () => {
  const {api,stats}=await audioHarness();
  assert.equal(await api.playCompanionVoice("cat","love"),true);
  assert.equal(await api.playCompanionVoice("cat","love"),true);
  assert.deepEqual(stats.requests,["/audio/pets/cat-happy-0.wav","/audio/pets/cat-happy-1.wav"]);
  assert.equal(stats.starts.length,2);
  assert.equal(stats.stops.length,1);
});

test("a late voice download stays silent after muting or switching to another companion", async () => {
  for(const changed of [{sound:false},{species:"dog"}]) {
    const {api,stats,prefs,waiting}=await audioHarness({deferred:true});
    const pending=api.playCompanionVoice("cat","play");
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(waiting.length,1);
    api.configureAudio({...prefs,...changed});
    waiting[0]();
    assert.equal(await pending,false);
    assert.equal(stats.starts.length,0);
  }
});

test("hiding the app stops an active companion voice", async () => {
  const {api,stats,listeners}=await audioHarness();
  api.installAudio();
  await api.playCompanionVoice("cat","love");
  document.hidden=true;
  listeners.get("visibilitychange")();
  assert.equal(stats.stops.length,1);
});

test("an explicit voice preview works during the introduction without starting outdoor ambience", async () => {
  const {api,stats,prefs}=await audioHarness();
  api.configureAudio({...prefs,active:false,sound:false});
  assert.equal(await api.previewCompanionVoice("rabbit"),true);
  assert.deepEqual(stats.requests,["/audio/pets/rabbit-happy-0.wav"]);
  assert.equal(stats.starts.length,1);
});
