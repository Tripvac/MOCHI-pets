import type { Species } from "./art";
import * as rules from "../shared/game.mjs";
import { catalog as allItems } from "../shared/catalog.mjs";
export type Room = "living" | "bedroom";
export interface Item {
  id: string;
  name: string;
  description: string;
  art: string;
  price: number;
  quality: "common" | "uncommon" | "rare" | "epic" | "legend";
  rarity: string;
  category: "food" | "furniture" | "accessory";
  value?: number;
  slot?: string;
  sceneWidth?: number;
  sceneLayer?: number;
}
export interface State {
  version: 3;
  roomEdition: number;
  name: string;
  species: Species;
  coins: number;
  xp: number;
  food: number;
  energy: number;
  joy: number;
  sleeping: boolean;
  sleepStarted: number;
  inventory: Record<string, number>;
  rooms: Record<Room, Record<string, string>>;
  accessory: string;
  counts: Record<string, number>;
  claims: string[];
  unlocked: string[];
  days: string[];
  lastSeen: number;
  lastFed: number;
  lastActions: Record<string, number>;
  createdAt: number;
  history: { text: string; at: number; actor?: string }[];
  stageIndex: number;
  superAt: number | null;
  ending: "left" | "graduated" | null;
  adopted: boolean;
  introSeen: boolean;
  rev: number;
  settings: {
    period: "auto" | "day" | "sunset" | "night";
    weather: "clear" | "cloud" | "rain" | "snow";
    weatherMode: "manual" | "live";
    temperature: number | null;
    weatherAt: number;
    volume: number;
    ambience: boolean;
    motion: boolean;
    sound: boolean;
  };
  error?: { id: number; message: string };
}
export type Action =
  | { type: "feed"; id: string }
  | { type: "pet" }
  | { type: "play" }
  | { type: "sleep" }
  | { type: "buy"; id: string; room?: Room; autoEquip?: boolean }
  | { type: "equip"; id: string; room?: Room }
  | {
      type: "game";
      game: "jump" | "bounce" | "catch" | "memory";
      score: number;
      coins?: number;
      levels?: number;
    }
  | { type: "claim"; id: string }
  | { type: "settings"; value: Partial<State["settings"]> }
  | { type: "rename"; name: string }
  | { type: "companion"; species: Species }
  | { type: "adopt"; species: Species; name: string }
  | { type: "tick" }
  | { type: "reset" }
  | { type: "intro" }
  | { type: "replace"; state: State };
export interface Achievement {
  id: string;
  title: string;
  description: string;
  goal: number;
  metric: string;
  reward: number;
  rarity: string;
  quality: string;
}
export const catalog = allItems as Item[];
export const foods = catalog.filter((i) => i.category === "food"),
  furniture = catalog.filter((i) => i.category === "furniture"),
  accessories = catalog.filter((i) => i.category === "accessory");
export const SAVE_KEY = "mochi-merged-v3";
export const initialState = (): State => {
  const s = rules.fresh() as State;
  if (typeof window !== "undefined")
    s.settings.motion = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
  return s;
};
export function loadState(): State {
  try {
    for (const key of [SAVE_KEY, "mochi.save.v1", "mochi-world-v2"]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data && [1, 2, 3].includes(data.version))
        return rules.normalize(data) as State;
    }
  } catch {}
  return initialState();
}
export const clamp = rules.clamp,
  thresholds = rules.thresholds,
  stageNames = rules.stageNames;
export const stage = (s: State) => s.stageIndex;
export const level = (s: State) => 1 + Math.floor(s.xp / 100);
export const achievements = rules.achievements as Achievement[];
export const achievementValue = (s: State, a: Achievement) =>
  rules.achievementValue(s, a);
export const elapsed = (s: State, now = Date.now()) =>
  rules.progress(s, now) as State;
export function reducer(s: State, a: Action): State {
  try {
    return rules.act(s, a) as State;
  } catch (e) {
    return {
      ...s,
      error: {
        id: Date.now() + Math.random(),
        message:
          e instanceof Error ? e.message : "Не удалось выполнить действие.",
      },
    };
  }
}
