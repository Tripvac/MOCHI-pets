import { companionIds, companions } from "../shared/companions.mjs";
import { assetUrl } from "./assets";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Heart,
  Home,
  Package,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { art, petArt, type Species } from "./art";
import { haptic, sound } from "./telegram";
import { previewCompanionVoice } from "./audio";
interface Props {
  adopted: boolean;
  petName: string;
  motion: boolean;
  sound: boolean;
  onSound: () => void;
  onSettings: () => void;
  onFinish: (species: Species, name: string) => Promise<boolean>;
}
const names = Object.fromEntries(companionIds.map(id => [id, companions[id].default])) as Record<Species, string>;
const titles = Object.fromEntries(companionIds.map(id => [id, companions[id].name])) as Record<Species, string>;
export default function Prologue(p: Props) {
  const [step, setStep] = useState(0),
    [species, setSpecies] = useState<Species>("cat"),
    [name, setName] = useState(companions.cat.default),
    [ready, setReady] = useState(true),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (step !== 4) {
      setReady(true);
      return;
    }
    setReady(!p.motion);
    const t = setTimeout(() => setReady(true), p.motion ? 1650 : 0);
    return () => clearTimeout(t);
  }, [step, p.motion]);
  const next = () => {
    haptic();
    if (step === 0) void sound("doorbell", p.sound);
    setStep((v) => Math.min(5, v + 1));
  };
  const back = () => {
    if (busy) return;
    haptic();
    setStep((v) => Math.max(0, v - 1));
  };
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await p.onFinish(species, name);
    } finally {
      setBusy(false);
    }
  };
  const labels = [
    "Войти в дом",
    "Открыть дверь",
    "Открыть коробку",
    "Взять свёрток",
    p.adopted ? "Вернуться к " + p.petName : "Давай познакомимся",
  ];
  return (
    <section
      className={`prologue-screen prologue-step-${step} ${p.motion ? "" : "reduced"}`}
      role="dialog"
      aria-modal="true"
      aria-label="История знакомства"
    >
      <div className="prologue-world">
        <img
          className="hall-image hall-closed"
          src={assetUrl("/art/v6/hall-closed.webp")}
          alt="Уютная прихожая с дубовой входной дверью"
        />
        <img
          className={`hall-image hall-open ${step >= 2 ? "revealed" : ""}`}
          src={assetUrl("/art/v6/hall-open.webp")}
          alt="Открытая дверь в солнечный дворик"
        />
        {step >= 2 && step < 5 && (
          <div
            className={`doorstep-box ${step >= 3 ? "opened" : ""} ${step === 4 ? "left-behind" : ""}`}
          >
            <img
              src={
                step < 3
                  ? art("box").toDataURL()
                  : assetUrl("/art/v3/box-open.webp")
              }
              alt={
                step < 3
                  ? "Доставленная коробка со свёртком"
                  : "Открытая картонная коробка"
              }
            />
          </div>
        )}
        {step === 4 && (
          <img
            className="intro-hands"
            src={assetUrl("/art/v3/hands-bundle.webp")}
            alt="Две руки в вязаных манжетах бережно поднимают свёрток с питомцем"
          />
        )}
        <div className="prologue-vignette" />
      </div>
      <header className="prologue-header">
        {step > 0 ? (
          <button
            className="intro-tool"
            aria-label="Предыдущая сцена"
            onClick={back}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="intro-emblem">
            <Heart size={19} />
          </span>
        )}
        <span className="intro-wordmark">маленькая история любви</span>
        <button
          className="intro-tool"
          onClick={p.onSettings}
          aria-label="Настройки вступления"
        >
          <Settings size={20} />
        </button>
      </header>
      {step === 1 && (
        <div className="doorbell-call">
          <Bell size={16} />
          <span>Динь-дон…</span>
          <i />
          <i />
        </div>
      )}
      {step < 5 ? (
        <div
          className={`prologue-copy ${step === 4 ? "lift-copy" : ""}`}
          key={step}
        >
          <span className="intro-kicker">
            {
              [
                "Добро пожаловать домой",
                "Кто-то у двери",
                "Оставлено с надеждой",
                "Внутри — целый маленький мир",
                "Теперь ты в надёжных руках",
              ][step]
            }
          </span>
          <h1>
            {
              [
                <>
                  В каждом доме
                  <br />
                  должна жить любовь.
                </>,
                <>
                  Кажется,
                  <br />
                  нас кто-то ждёт.
                </>,
                <>
                  Для тебя
                  <br />
                  маленькая посылка.
                </>,
                <>
                  Тихо-тихо…
                  <br />
                  кто-то сопит.
                </>,
                <>
                  Вот и<br />
                  встретились.
                </>,
              ][step]
            }
          </h1>
          {step === 2 ? (
            <blockquote className="delivery-note">
              «Не можем прокормить.
              <br />
              Пожалуйста, заберите.
              <br />
              <span>Спасибо большое ♡</span>»
            </blockquote>
          ) : (
            <p>
              {
                [
                  "Иногда большая дружба начинается с одного стука в дверь.",
                  "Звонок нарушил тихое утро. Посмотрим, кто пришёл?",
                  "",
                  "Под мягким пледом чувствуется маленькое тёплое сердечко.",
                  "Пусть этот дом станет началом вашей большой истории.",
                ][step]
              }
            </p>
          )}
          <button
            className="intro-primary"
            disabled={!ready || busy}
            onClick={step === 4 && p.adopted ? finish : next}
          >
            {step === 0 ? (
              <Home size={18} />
            ) : step === 1 ? (
              <Bell size={18} />
            ) : step < 4 ? (
              <Package size={18} />
            ) : (
              <Heart size={18} />
            )}
            <span>{ready ? labels[step] : "Бережно поднимаем…"}</span>
          </button>
          <div className="intro-bottom">
            <button
              onClick={p.onSound}
              aria-label={
                p.sound
                  ? "Выключить звук вступления"
                  : "Включить звук вступления"
              }
            >
              {p.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <div
              className="story-progress"
              aria-label={`Сцена ${step + 1} из 6`}
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <i className={i <= step ? "done" : ""} key={i} />
              ))}
            </div>
            <span>с любовью, MOCHI</span>
          </div>
        </div>
      ) : (
        <div className="adoption-sheet">
          <div className="adoption-heading">
            <span className="intro-kicker">Теперь вы — маленькая семья</span>
            <h1>
              Кого назовём
              <br />
              своим?
            </h1>
            <p>Выбери друга. Остальное вы придумаете вместе.</p>
          </div>
          <div className="adoption-pets">
            {companionIds.map(
              (sp) => (
                <button
                  key={sp}
                  className={species === sp ? "selected" : ""}
                  onClick={() => {
                    setSpecies(sp);
                    setName(names[sp]);
                    haptic();
                    if (p.sound) void previewCompanionVoice(sp);
                  }}
                >
                  <img src={petArt(sp).toDataURL()} alt={titles[sp]} />
                  <span>{titles[sp]}</span>
                  {species === sp && (
                    <i>
                      <Check size={13} />
                    </i>
                  )}
                </button>
              ),
            )}
          </div>
          <label className="input-label" htmlFor="adopt-pet-name">
            Как зовут твоего маленького друга?
          </label>
          <input
            className="name-input"
            id="adopt-pet-name"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="primary"
            disabled={busy || !name.trim()}
            onClick={finish}
          >
            <Home size={18} />
            Пойдём домой
          </button>
          <div className="adoption-gift">
            <Sparkles size={15} />
            <span>1000 монет и первые вещи для уютного дома</span>
          </div>
        </div>
      )}
    </section>
  );
}
