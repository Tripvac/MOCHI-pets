import { progress, H } from "./game.mjs";
import { companions } from "./companions.mjs";

export const WIDGET_SCHEMA = 1;
export const WIDGET_HORIZON = 48 * H;
const value = n => Math.round(Math.max(0, Math.min(100, Number(n) || 0)));
const frame = state => ({
  at: state.lastSeen,
  food: value(state.food),
  energy: value(state.energy),
  joy: value(state.joy),
  sleeping: !!state.sleeping,
  ending: state.ending || null,
});

// Use the actual game rules for every forecast entry. The widget never awards
// XP, consumes food, or writes a projected state back into the saved game.
export function widgetDocument(state, now = Date.now()) {
  const current = progress(state, now);
  const species = companions[current.species] ? current.species : "pusheen";
  const steps = [0];
  for (let halfHour=1; halfHour<=24; halfHour++) steps.push(halfHour*H/2);
  for (let hour=13; hour<=48; hour++) steps.push(hour*H);
  return {
    schema: WIDGET_SCHEMA,
    generatedAt: now,
    validUntil: now+WIDGET_HORIZON,
    name: String(current.name || companions[species].default).slice(0,24),
    species,
    adopted: !!current.adopted,
    accessory: current.accessory || "",
    stage: current.stageIndex,
    frames: steps.map(offset => frame(progress(current, now+offset))),
  };
}
