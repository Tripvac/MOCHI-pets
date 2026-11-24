import type { Species } from "./companions.mjs";
export type PetMotion = "rest" | "sleep" | "sway" | "curious" | "stretch" | "wiggle" | "hop" | "double-hop" | "cuddle" | "nibble" | "shake" | "loaf" | "sniff";
export const motionNames: PetMotion[];
export const companionProfiles: Record<Species, {idle: PetMotion[]; love: PetMotion[]; play: PetMotion[]; eat: PetMotion[]; wake: PetMotion[]; blink: number; breath: number; hop: number; lean: number; voice: string}>;
export function reactionFor(species: Species, emotion: string, sequence?: number, motion?: boolean): PetMotion;
export function idleFor(species: Species, sequence?: number): PetMotion;
export function voiceClip(species: Species, emotion: string, variation?: number): string | null;
