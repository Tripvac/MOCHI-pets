import { assetUrl } from "./assets";
import { voiceClip } from "../shared/companion-behavior.mjs";
import type { Species } from "./art";
export type SoundKind =
  "tap" | "feed" | "reward" | "pet" | "place" | "sleep" | "doorbell";
type Prefs = {
  sound: boolean;
  volume: number;
  ambience: boolean;
  active: boolean;
  weather: string;
  night: boolean;
  species: Species;
};
let prefs: Prefs = {
  sound: true,
  volume: 0.65,
  ambience: true,
  active: false,
  weather: "clear",
  night: false,
  species: "cat",
};
let ctx: AudioContext | undefined,
  loop: AudioBufferSourceNode | undefined,
  loopGain: GainNode | undefined,
  loopKey = "";
const buffers = new Map<string, Promise<AudioBuffer>>();
let attached = false,
  generation = 0;
let voiceGeneration = 0;
let voiceSource: AudioBufferSourceNode | undefined;
let voiceGain: GainNode | undefined;
const voiceTakes = new Map<string, number>();
function context() {
  if (!ctx || ctx.state === "closed") {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}
async function buffer(name: string) {
  if (!buffers.has(name))
    buffers.set(
      name,
      (async () => {
        const response = await fetch(assetUrl("/audio/" + name + ".wav"));
        if (!response.ok) throw Error("Sound unavailable");
        return await context().decodeAudioData(await response.arrayBuffer());
      })().catch((e) => {
        buffers.delete(name);
        throw e;
      }),
    );
  return buffers.get(name)!;
}
export async function unlockAudio() {
  try {
    const c = context();
    // Invoked synchronously during the user's pointer/keyboard gesture, before
    // any game action or network await can consume iOS activation.
    const resumed = c.state === "suspended" ? c.resume() : Promise.resolve();
    await resumed;
    void updateLoop();
    return c.state === "running";
  } catch {
    return false;
  }
}
export function installAudio() {
  if (attached) return;
  attached = true;
  const gesture = () => {
    void unlockAudio();
  };
  document.addEventListener("pointerdown", gesture, {
    capture: true,
    passive: true,
  });
  document.addEventListener("keydown", gesture, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopLoop(); stopVoice(); }
    else void updateLoop();
  });
}
export function stopVoice() {
  voiceGeneration++;
  if (voiceSource && ctx) {
    voiceGain?.gain.setTargetAtTime(0, ctx.currentTime, .012);
    try { voiceSource.stop(ctx.currentTime+.04); } catch { /* Already ended. */ }
  }
  voiceSource = undefined;
  voiceGain = undefined;
}
export function selectVoiceSpecies(species: Species) {
  if (prefs.species !== species) { stopVoice(); prefs = {...prefs, species}; }
}
export async function playCompanionVoice(species: Species, emotion: string, enabled = prefs.sound, preview = false) {
  if (!enabled || !prefs.sound || prefs.volume <= 0 || (!prefs.active && !preview) || document.hidden) return false;
  stopVoice();
  const request = voiceGeneration;
  const key = species+":"+emotion;
  const take = voiceTakes.get(key) || 0;
  const clip = voiceClip(species, emotion, take);
  if (!clip) return false;
  try {
    if (!(await unlockAudio())) return false;
    const data = await buffer(clip);
    if (request !== voiceGeneration || !prefs.sound || (!prefs.active && !preview) || prefs.species !== species || prefs.volume <= 0 || document.hidden) return false;
    const c = context(), source = c.createBufferSource(), gain = c.createGain();
    source.buffer = data;
    gain.gain.value = Math.max(0, Math.min(1, prefs.volume)) * .9;
    source.connect(gain); gain.connect(c.destination);
    voiceSource = source; voiceGain = gain;
    voiceTakes.set(key, take+1);
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      if (voiceSource === source) { voiceSource = undefined; voiceGain = undefined; }
    };
    source.start();
    return true;
  } catch { return false; }
}
export function previewCompanionVoice(species: Species) {
  selectVoiceSpecies(species);
  prefs = {...prefs, sound: true};
  return playCompanionVoice(species, "love", true, true);
}
export async function playSound(kind: SoundKind, enabled: boolean) {
  if (!enabled) return false;
  try {
    if (!(await unlockAudio())) return false;
    const data = await buffer(kind),
      c = context(),
      source = c.createBufferSource(),
      gain = c.createGain();
    source.buffer = data;
    gain.gain.value = Math.max(0, Math.min(1, prefs.volume)) * 0.8;
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    return true;
  } catch {
    return false;
  }
}
function stopLoop() {
  generation++;
  loop?.stop();
  loop?.disconnect();
  loopGain?.disconnect();
  loop = undefined;
  loopGain = undefined;
  loopKey = "";
}
async function updateLoop() {
  if (
    !ctx ||
    ctx.state !== "running" ||
    !prefs.sound ||
    !prefs.ambience ||
    !prefs.active ||
    document.hidden ||
    prefs.volume <= 0
  ) {
    stopLoop();
    return;
  }
  const key =
    prefs.weather === "rain" ? "rain" : prefs.night ? "night" : "garden";
  if (loopKey === key && loopGain) {
    loopGain.gain.setTargetAtTime(prefs.volume * 0.32, ctx.currentTime, 0.4);
    return;
  }
  stopLoop();
  const revision = generation;
  loopKey = key;
  try {
    const data = await buffer(key);
    if (
      revision !== generation ||
      !ctx ||
      !prefs.active ||
      !prefs.sound ||
      document.hidden
    )
      return;
    loop = ctx.createBufferSource();
    loop.buffer = data;
    loop.loop = true;
    loopGain = ctx.createGain();
    loopGain.gain.setValueAtTime(0, ctx.currentTime);
    loopGain.gain.linearRampToValueAtTime(
      prefs.volume * 0.32,
      ctx.currentTime + 1,
    );
    loop.connect(loopGain);
    loopGain.connect(ctx.destination);
    loop.start();
  } catch {
    loopKey = "";
  }
}
export function configureAudio(next: Prefs) {
  if (!next.sound || !next.active || next.volume <= 0 || next.species !== prefs.species) stopVoice();
  prefs = next;
  if (voiceGain && ctx) voiceGain.gain.setTargetAtTime(prefs.volume * .9, ctx.currentTime, .035);
  void updateLoop();
}
