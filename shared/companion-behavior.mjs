// Cosmetic behavior only: no timers, audio or animation state enter a saved home.
export const companionProfiles = {
  cat: { idle: ["curious", "stretch", "loaf"], love: ["cuddle", "sway"], play: ["wiggle", "hop"], eat: ["nibble", "sniff"], wake: ["stretch", "shake"], blink: 5100, breath: 4.8, hop: 7, lean: 2, voice: "Мягкое мяуканье" },
  rabbit: { idle: ["sniff", "curious", "hop"], love: ["cuddle", "sway"], play: ["double-hop", "wiggle"], eat: ["nibble", "sniff"], wake: ["stretch", "hop"], blink: 4500, breath: 3.8, hop: 11, lean: 2.5, voice: "Тихое урчание и сопение" },
  dog: { idle: ["wiggle", "sniff", "curious"], love: ["wiggle", "cuddle"], play: ["double-hop", "shake"], eat: ["nibble", "sniff"], wake: ["stretch", "shake"], blink: 4700, breath: 4.2, hop: 8, lean: 3, voice: "Звонкое гавканье таксы" },
  hamster: { idle: ["sniff", "sway", "curious"], love: ["cuddle", "wiggle"], play: ["hop", "double-hop"], eat: ["nibble", "sniff"], wake: ["stretch", "shake"], blink: 4200, breath: 3.6, hop: 7, lean: 2.5, voice: "Маленькие писки" },
  pusheen: { idle: ["loaf", "sway", "curious"], love: ["cuddle", "loaf"], play: ["wiggle", "hop"], eat: ["nibble", "sway"], wake: ["stretch", "shake"], blink: 5400, breath: 5.2, hop: 5, lean: 1.8, voice: "Низкое мультяшное мурчание" },
  capybara: { idle: ["sway", "sniff", "loaf"], love: ["cuddle", "sway"], play: ["wiggle", "hop"], eat: ["nibble", "sniff"], wake: ["stretch", "curious"], blink: 6100, breath: 5.8, hop: 4, lean: 1.5, voice: "Тёплый свист и бормотание" },
  cheems: { idle: ["curious", "wiggle", "sniff"], love: ["cuddle", "wiggle"], play: ["double-hop", "shake"], eat: ["nibble", "sniff"], wake: ["stretch", "shake"], blink: 4900, breath: 4.6, hop: 8, lean: 2.8, voice: "Хрипловатый голос сиба-ину" },
};
export const motionNames = ["rest", "sleep", "sway", "curious", "stretch", "wiggle", "hop", "double-hop", "cuddle", "nibble", "shake", "loaf", "sniff"];
export function reactionFor(species, emotion, sequence = 0, motion = true) {
  if (!motion) return "rest";
  if (emotion === "sleep") return "sleep";
  const list = companionProfiles[species]?.[emotion];
  return Array.isArray(list) ? list[Math.abs(sequence) % list.length] : "rest";
}
export function idleFor(species, sequence = 0) {
  const list = companionProfiles[species].idle;
  return list[Math.abs(sequence) % list.length];
}
export function voiceClip(species, emotion, variation = 0) {
  if (!companionProfiles[species]) return null;
  const mood = emotion === "sleep" ? "sleepy" : ["play", "wake"].includes(emotion) ? "excited" : "happy";
  return `pets/${species}-${mood}-${Math.abs(variation) % 2}`;
}
