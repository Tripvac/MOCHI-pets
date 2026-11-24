import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { companionIds } from "../shared/companions.mjs";
import { companionProfiles, reactionFor, idleFor, voiceClip, motionNames } from "../shared/companion-behavior.mjs";

test("companions vary idle and action movements while sleep and reduced motion take precedence", () => {
  const css = fs.readFileSync(new URL("../src/companions.css", import.meta.url), "utf8");
  for (const species of companionIds) {
    const profile = companionProfiles[species];
    assert.equal(new Set([0,1,2].map(i=>idleFor(species,i))).size, 3, species);
    for (const emotion of ["love", "play", "eat", "wake"]) {
      const variants = new Set([0,1,2,3].map(i=>reactionFor(species,emotion,i)));
      assert.ok(variants.size >= 2, species+" "+emotion);
      for (const name of variants) {
        assert.ok(motionNames.includes(name));
        assert.ok(css.includes(`[data-motion="${name}"]`), name+" rendered");
      }
      assert.equal(reactionFor(species, emotion, 3, false), "rest");
    }
    assert.equal(reactionFor(species, "sleep", 5), "sleep");
    assert.equal(reactionFor(species, "sleep", 5, false), "rest");
    assert.ok(profile.hop <= 11 && profile.lean <= 3);
  }
});

test("every companion has six distinct, playable PCM voice takes with safe peaks and audible energy", () => {
  const hashes = new Set();
  for (const species of companionIds) {
    for (const emotion of ["love", "play", "sleep"]) {
      for (const take of [0,1]) {
        const name = voiceClip(species, emotion, take);
        const data = fs.readFileSync(new URL("../public/audio/"+name+".wav", import.meta.url));
        assert.equal(data.toString("ascii",0,4), "RIFF");
        assert.equal(data.toString("ascii",8,12), "WAVE");
        assert.equal(data.readUInt16LE(20), 1);
        assert.equal(data.readUInt16LE(22), 1);
        assert.equal(data.readUInt32LE(24), 22050);
        assert.equal(data.readUInt16LE(34), 16);
        const count = data.readUInt32LE(40)/2;
        assert.ok(count > 22050*.5 && count < 22050*2);
        let peak=0, energy=0;
        for(let i=0;i<count;i++) {const sample=data.readInt16LE(44+i*2)/32768;peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}
        assert.ok(peak < .6 && peak > .25, name+" peak");
        assert.ok(Math.sqrt(energy/count) > .02, name+" audible");
        hashes.add(createHash("sha256").update(data).digest("hex"));
      }
    }
  }
  assert.equal(hashes.size, 42);
  assert.equal(voiceClip("unknown", "love"), null);
});
