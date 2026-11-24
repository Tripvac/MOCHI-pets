import type { State } from "../src/model";
import type { Species } from "./companions.mjs";
export interface WidgetFrame { at: number; food: number; energy: number; joy: number; sleeping: boolean; ending: "left" | "graduated" | null; }
export interface WidgetDocument {schema: number; generatedAt: number; validUntil: number; name: string; species: Species; adopted: boolean; accessory: string; stage: number; frames: WidgetFrame[];}
export const WIDGET_SCHEMA: number;
export const WIDGET_HORIZON: number;
export function widgetDocument(state: State, now?: number): WidgetDocument;
