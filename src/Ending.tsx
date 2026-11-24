import { assetUrl } from "./assets";
import { useEffect, useState } from "react";
import { Heart, Home, RotateCcw } from "lucide-react";
import { petArt } from "./art";
import type { State } from "./model";
export default function Ending({
  state: s,
  onRestart,
}: {
  state: State;
  onRestart: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    document.querySelector<HTMLElement>(".ending-screen button")?.focus();
  }, []);
  return (
    <section
      className={`ending-screen ${s.ending === "graduated" ? "graduated" : "left"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Конец истории"
    >
      <img
        className="ending-room"
        src={assetUrl("/art/v3/room-night.webp")}
        alt="Тихая комната"
      />
      {s.ending === "graduated" && (
        <div className="farewell-car">
          <img
            src={petArt(
              s.species,
              "happy",
              0,
              s.accessory,
              s.stageIndex,
            ).toDataURL()}
            alt={s.name}
          />
          <div className="car-body">
            <span />
            <i />
            <i />
          </div>
        </div>
      )}
      <div className="ending-card">
        <Heart size={26} />
        <span className="eyebrow">
          {s.ending === "graduated"
            ? "Большое путешествие"
            : "Записка на прощание"}
        </span>
        <h1>
          {s.ending === "graduated"
            ? "Спасибо за наш дом."
            : "Я буду помнить тебя."}
        </h1>
        <blockquote>
          {s.ending === "graduated"
            ? "«Спасибо за дом, тепло и любовь. Теперь мне пора увидеть большой мир!»"
            : "«Прости, родитель, я ушёл в другую семью. Люблю, целую». "}
        </blockquote>
        <p>
          {s.ending === "graduated"
            ? `${s.name} прожил две недели в своей особой форме и отправился навстречу приключениям.`
            : "Семь дней без еды оказались слишком долгими. Можно начать новую историю и заботиться о новом друге."}
        </p>
        <div className="ending-memories">
          <span>{s.counts.feed} угощений</span>
          <span>{s.counts.games} игр</span>
          <span>{s.counts.pet} объятий</span>
        </div>
        {confirm ? (
          <>
            <p className="reset-caption">
              Начнётся новая история. Прогресс этого питомца будет заменён.
            </p>
            <button className="primary" onClick={onRestart}>
              <Home size={17} />
              Начать новую историю
            </button>
            <button className="text-button" onClick={() => setConfirm(false)}>
              Ещё немного побыть здесь
            </button>
          </>
        ) : (
          <button className="primary" onClick={() => setConfirm(true)}>
            <RotateCcw size={17} />
            Открыть новую главу
          </button>
        )}
        <small>MOCHI · маленькие моменты остаются с нами</small>
      </div>
    </section>
  );
}
