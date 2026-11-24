import type { Species } from "./companions.mjs";
export interface PetRig {
  center: number; neck: number; neckWidth: number; forehead: number; headWidth: number; eyeY: number;
  bow: [number, number]; eyes: [number, number, number, number][];
}
export const petRigs: Record<Species, PetRig>;
export function headwearPlacement(species: Species): {center: number; base: number; width: number; capHeight: number; pom: boolean; crownHeight: number; coneHeight: number; heightScale: number};
export const PET_HEADROOM: number;
export const headwearKinds: string[];
export function headwearRise(species: Species, accessory: string, stage?: number): number;
