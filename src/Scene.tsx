import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { assetUrl } from "./assets";
import { art, petArt } from "./art";
import LightingShader from "./LightingShader";
import LavaLamp, { isLava } from "./LavaLamp";
import {
  glassPanes,
  placedPosition,
  roomPainting,
  tabletopPlacement,
} from "../shared/scene-geometry.mjs";
import { furniture, stage, type State, type Room } from "./model";
import { companionProfiles, reactionFor, idleFor, type PetMotion } from "../shared/companion-behavior.mjs";

export interface SceneProps {
  state: State;
  room: Room;
  emotion: string;
  effect: number;
  onPet: () => void;
  period: "day" | "sunset" | "night";
}
const urls = new WeakMap<HTMLCanvasElement, string>();
export function canvasUrl(canvas: HTMLCanvasElement) {
  let url = urls.get(canvas);
  if (!url) {
    url = canvas.toDataURL();
    urls.set(canvas, url);
  }
  return url;
}
export default function Scene({
  state: s,
  room,
  emotion,
  effect,
  onPet,
  period,
}: SceneProps) {
  const [idleFrame, setIdleFrame] = useState(0);
  const [idleMotion, setIdleMotion] = useState<PetMotion>("rest");
  const [idleSequence, setIdleSequence] = useState(0);
  const [blink, setBlink] = useState(0),
    [failed, setFailed] = useState(false);
  const equipped = s.rooms[room];
  const clipId = "glass" + useId().replace(/:/g, "");
  const glassClip = { clipPath: `url(#${clipId})` };
  const night = s.sleeping || period === "night";
  const profile = companionProfiles[s.species];
  const em = s.sleeping
    ? "sleep"
    : emotion !== "happy"
      ? emotion
      : s.joy < 30
        ? "sad"
        : "happy";
  const pet = useMemo(
    () =>
      canvasUrl(
        petArt(
          s.species,
          em,
          blink === 2 ? 2 : idleFrame,
          s.accessory,
          stage(s),
          true,
        ),
      ),
    [s.species, em, blink, idleFrame, s.accessory, s.stageIndex],
  );
  useEffect(() => {
    setFailed(false);
  }, [room]);
  useEffect(() => {
    if (!s.settings.motion || s.sleeping) return;
    let close: ReturnType<typeof setTimeout>;
    const idle = setInterval(() => setIdleFrame((v) => 1 - v), 1600);
    const timer = setInterval(() => {
      setBlink(2);
      close = setTimeout(() => setBlink(0), 170);
    }, profile.blink);
    return () => {
      clearInterval(timer);
      clearInterval(idle);
      setIdleFrame(0);
      clearTimeout(close);
      setBlink(0);
    };
  }, [s.settings.motion, s.sleeping, s.species, profile.blink]);
  useEffect(() => {
    setIdleMotion("rest");
    if (!s.settings.motion || s.sleeping || em !== "happy") return;
    let count = 0;
    let next: ReturnType<typeof setTimeout>;
    let settle: ReturnType<typeof setTimeout>;
    const schedule = () => {
      next = setTimeout(() => {
        if (!document.hidden) {
          setIdleMotion(idleFor(s.species, count++));
          setIdleSequence(n => n+1);
          settle = setTimeout(() => setIdleMotion("rest"), 2400);
        }
        schedule();
      }, 8500 + (count % 3)*1700);
    };
    schedule();
    return () => { clearTimeout(next); clearTimeout(settle); };
  }, [s.settings.motion, s.sleeping, s.species, em]);
  const reaction = reactionFor(s.species, em, effect, s.settings.motion);
  const motion = reaction === "rest" ? idleMotion : reaction;
  const items = useMemo(
    () =>
      Object.entries(equipped).flatMap(([slot, id]) => {
        const item = furniture.find((i) => i.id === id),
          base = placedPosition(room, slot);
        if (
          !item ||
          !base ||
          (["lamp", "tabletop", "lava"].includes(slot) && !equipped.table)
        )
          return [];
        let position = [...base],
          supportRise = 0,
          supportOffset = 0;
        const sprite = art(item.art);
        if (["lamp", "lava", "tabletop"].includes(slot) && equipped.table) {
          const table = furniture.find((i) => i.id === equipped.table)!;
          const tableArt = art(table.art),
            tablePos = placedPosition(room, "table")!;
          const anchor = tabletopPlacement(
            slot,
            tablePos,
            tableArt.height / tableArt.width,
          )!;
          position = anchor.position;
          supportRise = anchor.supportRise;
          supportOffset = anchor.supportOffset;
        }
        if (item.sceneWidth) position[2] = item.sceneWidth;
        if (item.sceneLayer !== undefined) position[3] = item.sceneLayer;
        return [
          {
            item,
            slot,
            position,
            src: canvasUrl(sprite),
            aspect: isLava(item.id) ? 144 / 64 : sprite.height / sprite.width,
            supportRise,
            supportOffset,
          },
        ];
      }),
    [equipped, room],
  );
  const lights = items.filter((i) =>
    ["lamp", "lava", "floorlamp", "ceiling"].includes(i.slot),
  );
  const painting = roomPainting(room, s.settings.weather, night);
  return (
    <div
      className={`scene-render room-scene room-${room} room-${night ? "night" : period} weather-${s.settings.weather} ${s.settings.motion ? "" : "room-still"} ${failed ? "room-fallback" : ""}`}
      role="group"
      aria-label={`${room === "living" ? "Гостиная" : "Спальня"}. ${s.name} ${s.sleeping ? "спит" : "отдыхает дома"}`}
    >
      <div
        className={`room-architecture ${failed ? "architecture-fallback" : ""}`}
      >
        {failed && (
          <div className="painted-window">
            <div />
            <div />
            <div />
            <span />
          </div>
        )}
        <img
          className="room-background"
          src={assetUrl(painting)}
          onError={() => setFailed(true)}
          hidden={failed}
          alt={
            room === "living"
              ? "Уютная синяя гостиная с большим американским окном"
              : "Синяя спальня со светлым окном и дубовым полом"
          }
          draggable={false}
        />
      </div>
      <svg className="glass-geometry" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            {(failed
              ? [
                  [
                    [0.3, 0.25],
                    [0.44, 0.25],
                    [0.44, 0.5],
                    [0.3, 0.5],
                  ],
                  [
                    [0.46, 0.25],
                    [0.61, 0.25],
                    [0.61, 0.5],
                    [0.46, 0.5],
                  ],
                  [
                    [0.63, 0.25],
                    [0.8, 0.25],
                    [0.8, 0.5],
                    [0.63, 0.5],
                  ],
                ]
              : glassPanes[room]
            ).map((pane, i) => (
              <polygon
                key={i}
                points={pane.map((p) => p.join(",")).join(" ")}
              />
            ))}
          </clipPath>
        </defs>
      </svg>
      <div className="outdoor-view" style={glassClip} aria-hidden="true">
        <img src={assetUrl(painting)} alt="" draggable={false} />
        <div className="outdoor-night-sky" />
      </div>
      <div
        className="window-weather precise-glass"
        style={glassClip}
        aria-hidden="true"
      >
        <div className="weather-clouds" />
        <div className="rain-lines" />
        <div className="rain-beads" />
        <div className="snow-flakes" />
        <div className="moonlight" />
      </div>
      <div className="room-sunbeams" aria-hidden="true" />
      <div
        className="room-furniture"
        aria-label={`Обстановка: ${room === "living" ? "гостиная" : "спальня"}`}
      >
        {items.map(
          ({ item, slot, position: p, src, supportRise, supportOffset }) => {
            const classes = `placed-object placed-${slot} ${night && ["lamp", "lava", "floorlamp", "ceiling"].includes(slot) ? "lamp-on" : ""}`;
            const style = {
              left: `calc(${p[0]}% + var(--room-unit) * ${supportOffset})`,
              top: `calc(${p[1]}% - var(--room-unit) * ${supportRise})`,
              width: `calc(var(--room-unit) * ${p[2]})`,
              zIndex: p[3],
            } as CSSProperties;
            return isLava(item.id) ? (
              <div
                key={item.id}
                className={classes + " placed-lava-lamp"}
                data-item={item.id}
                role="img"
                aria-label={item.name}
                style={{ ...style, aspectRatio: "64 / 144" }}
              >
                <LavaLamp
                  kind={item.id}
                  animate={s.settings.motion}
                  decorative
                />
              </div>
            ) : (
              <img
                key={item.id}
                className={classes}
                data-item={item.id}
                src={src}
                alt={item.name}
                draggable={false}
                style={style}
              />
            );
          },
        )}
      </div>
      {night &&
        lights.map(
          ({ item, slot, position: p, aspect, supportRise, supportOffset }) => (
            <div
              key={"light-" + item.id}
              className={`lamp-emitter lamp-${slot}`}
              style={
                {
                  left: `calc(${p[0]}% + var(--room-unit) * ${supportOffset})`,
                  top: `calc(${p[1]}% - var(--room-unit) * ${supportRise})`,
                  width: `calc(var(--room-unit) * ${p[2]})`,
                  aspectRatio: String(1 / aspect),
                } as CSSProperties
              }
              aria-hidden="true"
            >
              <i className="lamp-halo" />
              <i className="lamp-shade-glow" />
              <i className="lamp-downlight" />
            </div>
          ),
        )}
      <LightingShader
        night={night}
        emitters={lights}
        motion={s.settings.motion}
      />
      <button
        className={`pet-actor pet-${s.species} emotion-${em}`}
        data-motion={s.settings.motion ? motion : "rest"}
        onClick={onPet}
        aria-label={`Погладить ${s.name}`}
        style={
          { "--pet-size": [40, 42, 44, 46][stage(s)] + "%", "--pet-hop": profile.hop+"px", "--pet-lean": profile.lean+"deg", "--pet-breath": profile.breath+"s" } as CSSProperties
        }
      >
        <span className="pet-floor-shadow" />
        <img key={`${s.species}-${motion}-${effect}-${idleSequence}`} src={pet} alt={s.name} draggable={false} />
        {em === "love" && (
          <span className="pet-hearts" key={effect} aria-hidden="true">
            ♡<i>♥</i>♡
          </span>
        )}
        {s.sleeping && (
          <span className="pet-sleeping" aria-hidden="true">
            z<span>z</span>
            <i>z</i>
          </span>
        )}
      </button>
      <div className="room-dust" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <i
            key={i}
            style={{
              left: 13 + i * 11 + "%",
              animationDelay: -i * 1.7 + "s",
              top: 27 + i * 6 + "%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
