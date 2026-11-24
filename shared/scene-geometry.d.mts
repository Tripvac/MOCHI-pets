import type { Room } from "../src/model";
export const glassPanes: Record<Room, number[][][]>;
export function pointInGlass(room: Room, x: number, y: number): boolean;
export function roomPainting(
  room: Room,
  weather: string,
  night?: boolean,
): string;
export function placedPosition(room: Room, slot: string): number[] | null;
export function lampSource(
  position: number[],
  aspect: number,
  width: number,
  height: number,
  riseFraction?: number,
  supportRise?: number,
  supportOffset?: number,
): number[];

export function tabletopPlacement(
  slot: string,
  table: number[],
  aspect: number,
): { position: number[]; supportRise: number; supportOffset: number } | null;
