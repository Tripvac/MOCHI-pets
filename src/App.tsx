import { useEffect, useRef, useState, useReducer, type ReactNode } from "react";
import {
  Cloud,
  Users,
  BookOpen,
  Wifi,
  X,
  Plus,
  Coins,
  Sparkles,
  Trophy,
  ChevronRight,
  Check,
  Wind,
  ArrowDownUp,
  Leaf,
  Armchair,
  Shirt,
  Package,
  ArrowLeft,
  Flower2,
  Gift,
  PawPrint,
  Clock,
  RotateCcw,
} from "lucide-react";
import {
  Home,
  Gamepad2,
  Moon,
  Heart,
  Utensils,
  Strawberry,
  ShoppingBag,
  BookHeart,
  Menu,
  Sun,
  Paintbrush,
  Volume2,
  VolumeX,
  Snowflake,
  CloudRain,
  Settings,
} from "./PixelIcons";
import { companionIds, companions } from "../shared/companions.mjs";
import Scene from "./Scene";
import LavaLamp, { isLava } from "./LavaLamp";
import Prologue from "./Prologue";
import Ending from "./Ending";
import SharedHome from "./SharedHome";
import PhoneWidgetSetup from "./PhoneWidgetSetup";
import { useGameStore } from "./useGameStore";
import Game, { type GameKind } from "./Games";
import { art, petArt, type Species } from "./art";
import {
  loadState,
  reducer,
  SAVE_KEY,
  foods,
  furniture,
  accessories,
  achievements,
  achievementValue,
  level,
  stage,
  stageNames,
  thresholds,
  type Room,
  type State,
  type Item,
} from "./model";
import { initTelegram, haptic, sound } from "./telegram";
import { configureAudio, playCompanionVoice, previewCompanionVoice, selectVoiceSpecies } from "./audio";
import { companionProfiles } from "../shared/companion-behavior.mjs";
import { headwearRise } from "../shared/pet-rigs.mjs";
import { almatyWeather } from "./weather";

type Panel =
  | "feed"
  | "shop"
  | "games"
  | "journal"
  | "menu"
  | "settings"
  | "achievements"
  | "wardrobe"
  | "shared"
  | null;
const speciesNames = Object.fromEntries(
  companionIds.map((id) => [id, companions[id].label]),
) as Record<Species, string>;
function Pixel({
  kind,
  size = 64,
  className = "",
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  if (isLava(kind))
    return (
      <LavaLamp
        kind={kind}
        animate={false}
        size={size}
        className={`pixel-art ${className}`}
        decorative
      />
    );
  return (
    <img
      className={`pixel-art ${className}`}
      src={art(kind).toDataURL()}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
function PetImage({
  species = "cat",
  size = 100,
  accessory = "",
  stage = 0,
}: {
  species?: Species;
  size?: number;
  accessory?: string;
  stage?: number;
}) {
  return (
    <img
      className="pixel-art"
      src={petArt(species, "happy", 0, accessory, stage).toDataURL()}
      width={size}
      height={size}
      alt={speciesNames[species]}
    />
  );
}
function Coin({ amount }: { amount: number }) {
  return (
    <span className="coin-amount">
      <span className="coin-icon">$</span>
      {amount.toLocaleString("ru-RU")}
    </span>
  );
}
function Sheet({
  title,
  eyebrow,
  children,
  onClose,
  kind = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  kind?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const first = box.current?.querySelector<HTMLElement>(
      'button, input, select, [tabindex="0"]',
    );
    first?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const list = Array.from(
          box.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, select, [tabindex="0"]',
          ) || [],
        ).filter((el) => el.offsetParent !== null);
        const a = list[0],
          z = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          z?.focus();
          e.preventDefault();
        }
        if (!e.shiftKey && document.activeElement === z) {
          a?.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    const tg = window.Telegram?.WebApp;
    const back = () => close.current();
    if (tg?.initData) {
      tg.BackButton.show();
      tg.BackButton.onClick(back);
    }
    return () => {
      document.removeEventListener("keydown", key);
      if (tg?.initData) {
        tg.BackButton.offClick(back);
        tg.BackButton.hide();
      }
      old?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="modal-layer">
      <div className="sheet-shade" onClick={onClose} />
      <div
        ref={box}
        className={`sheet ${kind}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const store = useGameStore();
  const { state: s, dispatch } = store;
  const [panel, setPanel] = useState<Panel>(null),
    [room, setRoom] = useState<"living" | "bedroom">("living"),
    [emotion, setEmotion] = useState("happy"),
    [effect, setEffect] = useState(0),
    [bubble, setBubble] = useState("Хорошо, что ты рядом."),
    [toast, setToast] = useState(""),
    [foodAnim, setFoodAnim] = useState(""),
    [game, setGame] = useState<GameKind | null>(null),
    [story, setStory] = useState(!s.introSeen);
  const emotionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    foodTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousStage = useRef(stage(s));
  const sleepingNow = useRef(s.sleeping);
  sleepingNow.current = s.sleeping;
  const notify = (text: string) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };
  useEffect(() => initTelegram(), []);
  useEffect(() => {
    const selector = story ? ".prologue-screen" : game ? ".game-modal" : null;
    if (!selector) return;
    const modal = document.querySelector<HTMLElement>(selector);
    const first = modal?.querySelector<HTMLElement>("button, input");
    first?.focus({ preventScroll: true });
    const close = () => {
      if (game) {
        setGame(null);
        setPanel(null);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && game) {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        const list = Array.from(
          modal?.querySelectorAll<HTMLElement>("button:not(:disabled),input") ||
            [],
        ).filter((el) => el.offsetParent !== null);
        const a = list[0],
          z = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          z?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === z) {
          a?.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    const tg = window.Telegram?.WebApp;
    if (game && tg?.initData) {
      tg.BackButton.show();
      tg.BackButton.onClick(close);
    }
    return () => {
      document.removeEventListener("keydown", key);
      if (game && tg?.initData) {
        tg.BackButton.offClick(close);
        tg.BackButton.hide();
      }
    };
  }, [game, story]);
  useEffect(() => {
    if (s.error) notify(s.error.message);
  }, [s.error?.id]);
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: "tick" }), 30000);
    const wake = () => {
      if (!document.hidden) dispatch({ type: "tick" });
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      clearTimeout(emotionTimer.current);
      clearTimeout(toastTimer.current);
      clearTimeout(foodTimer.current);
    };
  }, []);
  useEffect(() => {
    if (stage(s) > previousStage.current) {
      setEmotion("love");
      setBubble("Смотри, как я вырос!");
      notify(`Новая форма: ${stageNames[stage(s)]}`);
      haptic(true);
    }
    previousStage.current = stage(s);
  }, [s.xp]);
  const animate = (em: string, text: string) => {
    clearTimeout(emotionTimer.current);
    setEmotion(em);
    setEffect((v) => v + 1);
    setBubble(text);
    emotionTimer.current = setTimeout(() => {
      setEmotion("happy");
      setBubble(
        sleepingNow.current ? "Тсс… здесь живут сладкие сны." : "Хорошо, что ты рядом.",
      );
    }, 4000);
  };
  const pet = async () => {
    if (story) return;
    if (!(await dispatch({ type: "pet" }))) return;
    animate(
      "love",
      [
        "Это моя любимая часть дня.",
        "Можно ещё немного обнимашек?",
        "Я тебя тоже люблю.",
      ][Math.floor(Math.random() * 3)],
    );
    haptic();
    void playCompanionVoice(s.species, "love", s.settings.sound);
  };
  const feed = async (id: string) => {
    if (!(await dispatch({ type: "feed", id }))) return;
    setPanel(null);
    setFoodAnim(id);
    clearTimeout(foodTimer.current);
    foodTimer.current = setTimeout(() => setFoodAnim(""), 1300);
    animate("eat", "М-м-м… как вкусно. Спасибо!");
    haptic(true);
    sound("feed", s.settings.sound);
    void playCompanionVoice(s.species, "eat", s.settings.sound);
  };
  const sleep = async () => {
    if (!(await dispatch({ type: "sleep" }))) return;
    setRoom("bedroom");
    animate(s.sleeping ? "wake" : "sleep", s.sleeping ? "Я выспался. Что будем делать?" : "Побудь рядом, пока я засыпаю…");
    void playCompanionVoice(s.species, s.sleeping ? "wake" : "sleep", s.settings.sound);
    haptic();
  };
  const buy = async (item: Item, targetRoom: Room = room) => {
    if (
      !(await dispatch({
        type: "buy",
        id: item.id,
        room: targetRoom,
        autoEquip: true,
      }))
    )
      return;
    if (item.category === "furniture") setRoom(targetRoom);
    notify(
      item.category === "food"
        ? item.name + " уже в кладовой"
        : item.name + " — теперь дома",
    );
    haptic(true);
    sound(item.category === "food" ? "reward" : "place", s.settings.sound);
  };
  const play = async () => {
    if (!(await dispatch({ type: "play" }))) return;
    setPanel(null);
    animate("play", "Эй, клубочек! Давай ещё раз?");
    void playCompanionVoice(s.species, "play", s.settings.sound);
    haptic();
  };
  const restart = async () => {
    if (!(await dispatch({ type: "reset" }))) return;
    setPanel(null);
    setGame(null);
    setRoom("living");
    setStory(true);
  };
  const open = (p: Panel) => {
    haptic();
    setPanel(p);
  };
  const hour = new Date().getHours();
  const period =
    s.settings.period === "auto"
      ? hour >= 20 || hour < 6
        ? "night"
        : hour >= 17
          ? "sunset"
          : "day"
      : s.settings.period;
  const nextThreshold = thresholds[s.stageIndex + 1];
  const growth = nextThreshold
    ? Math.max(
        0,
        Math.min(
          100,
          ((s.xp - thresholds[s.stageIndex]) /
            (nextThreshold - thresholds[s.stageIndex])) *
            100,
        ),
      )
    : 100;
  useEffect(() => {
    configureAudio({
      sound: s.settings.sound,
      volume: s.settings.volume,
      ambience: s.settings.ambience,
      weather: s.settings.weather,
      night: s.sleeping || period === "night",
      active: !story && !s.ending,
      species: s.species,
    });
  }, [
    s.settings.sound,
    s.settings.volume,
    s.settings.ambience,
    s.settings.weather,
    s.sleeping,
    period,
    story,
    s.ending,
    s.species,
  ]);
  useEffect(() => {
    if (s.settings.weatherMode !== "live") return;
    let cancelled = false;
    const update = async () => {
      try {
        const value = await almatyWeather();
        if (!cancelled) await dispatch({ type: "settings", value });
      } catch {
        /* Last selected weather remains visible offline. */
      }
    };
    void update();
    const timer = setInterval(() => void update(), 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [s.settings.weatherMode, dispatch]);
  const ready = achievements.filter(
    (a) => achievementValue(s, a) >= a.goal && !s.claims.includes(a.id),
  ).length;
  return (
    <main
      className={`app-shell ${s.settings.motion ? "" : "no-motion"} ${story ? "has-story" : ""}`}
    >
      <section
        inert={!!(panel || game || story || s.ending)}
        style={
          {
            "--pet-width": [40, 42, 44, 46][stage(s)],
            "--headwear-rise": headwearRise(s.species, s.accessory, stage(s)),
          } as import("react").CSSProperties
        }
        className={`home-screen ${s.sleeping || period === "night" ? "is-night" : ""}`}
      >
        <Scene
          state={s}
          room={room}
          emotion={emotion}
          effect={effect}
          onPet={pet}
          period={period}
        />
        <div className="scene-top-fade" />
        <div className="scene-bottom-fade" />
        <header className="hud">
          <button
            className="profile-button"
            onClick={() => open("journal")}
            aria-label="О питомце"
          >
            <PawPrint size={23} strokeWidth={1.6} />
          </button>
          <div className="hud-spacer" />
          <button
            className="wallet"
            onClick={() => open("games")}
            aria-label={`${s.coins} монет. Получить монеты в играх`}
          >
            <Coin amount={s.coins} />
            <span className="wallet-plus">
              <Plus size={16} />
            </span>
          </button>
          <button
            className="icon-button menu-trigger"
            onClick={() => open("menu")}
            aria-label="Открыть меню"
          >
            <Menu size={23} />
          </button>
        </header>
        <div className="room-switch" role="tablist" aria-label="Комната">
          <button
            role="tab"
            aria-selected={room === "living"}
            className={room === "living" ? "active" : ""}
            onClick={() => {
              setRoom("living");
              haptic();
            }}
          >
            Гостиная
          </button>
          <button
            role="tab"
            aria-selected={room === "bedroom"}
            className={room === "bedroom" ? "active" : ""}
            onClick={() => {
              setRoom("bedroom");
              haptic();
            }}
          >
            Спальня
          </button>
        </div>
        <div className="needs" aria-label="Состояние питомца">
          <Need
            title="Еда"
            value={s.food}
            kind="food"
            icon={<Utensils size={14} />}
            onClick={() =>
              s.sleeping ? notify("Сначала разбуди питомца") : open("feed")
            }
          />
          <Need
            title="Сон"
            value={s.energy}
            kind="energy"
            icon={<Moon size={14} />}
            onClick={sleep}
          />
          <Need
            title="Игры"
            value={s.joy}
            kind="joy"
            icon={<Heart size={14} />}
            onClick={() => open("games")}
          />
        </div>
        <button
          className="weather-badge"
          onClick={() => open("settings")}
          aria-label="Настроить время суток и погоду"
        >
          {s.settings.weather === "rain" ? (
            <CloudRain size={15} />
          ) : s.settings.weather === "snow" ? (
            <Snowflake size={15} />
          ) : s.settings.weather === "cloud" ? (
            <Cloud size={15} />
          ) : s.sleeping || period === "night" ? (
            <Moon size={15} />
          ) : (
            <Sun size={15} />
          )}
          <span>
            {s.settings.weather === "rain"
              ? "Тихий дождь"
              : s.settings.weather === "snow"
                ? "За окном снег"
                : s.settings.weather === "cloud"
                  ? "Облачно"
                  : s.sleeping || period === "night"
                    ? "Лунная ночь"
                    : period === "sunset"
                      ? "Тёплый вечер"
                      : "Солнечный день"}
            {s.settings.weatherMode === "live" &&
            s.settings.temperature !== null
              ? " · " + s.settings.temperature + "°"
              : ""}
          </span>
        </button>
        <button
          className="room-sound-button"
          aria-label={s.settings.sound ? "Выключить звук" : "Включить звук"}
          aria-pressed={s.settings.sound}
          onClick={() => {
            dispatch({ type: "settings", value: { sound: !s.settings.sound } });
            void sound("tap", !s.settings.sound);
          }}
        >
          {s.settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="decorate-button"
          aria-label="Обустроить комнату"
          onClick={() => open("wardrobe")}
        >
          <Paintbrush size={19} />
        </button>
        <div
          className={`pet-dialogue ${emotion === "love" ? "loving" : ""}`}
          onClick={() => open("journal")}
        >
          <span className="pet-name">
            {s.name}
            {s.sleeping && <Moon size={12} />}
          </span>
          <p key={bubble}>{bubble}</p>
          <span className="dialogue-tail" />
        </div>
        {foodAnim && (
          <div className="food-animation" key={effect}>
            <Pixel kind={foodAnim} size={85} />
            <span>+{foods.find((f) => f.id === foodAnim)?.value}</span>
          </div>
        )}
        <div className="care-controls" aria-label="Уход за питомцем">
          <button
            onClick={() =>
              s.sleeping ? notify("Сначала разбуди питомца") : open("feed")
            }
          >
            <span className="care-icon">
              <Strawberry size={28} />
            </span>
            <span>Кормить</span>
          </button>
          <button
            onClick={() =>
              s.sleeping ? notify("Пусть сначала выспится") : open("games")
            }
          >
            <span className="care-icon games-icon">
              <Gamepad2 size={29} strokeWidth={1.5} />
            </span>
            <span>Играть</span>
          </button>
          <button className={s.sleeping ? "selected" : ""} onClick={sleep} aria-label={s.sleeping ? "Разбудить питомца" : "Уложить питомца спать"}>
            <span className="care-icon sleep-icon">
              {s.sleeping ? (
                <Sun size={28} strokeWidth={1.5} />
              ) : (
                <Moon size={28} strokeWidth={1.5} />
              )}
            </span>
            <span>{s.sleeping ? "Будить" : "Спать"}</span>
          </button>
          <button onClick={pet}>
            <span className="care-icon love-icon">
              <Heart size={28} strokeWidth={1.5} />
            </span>
            <span>Гладить</span>
          </button>
        </div>
        <div className="home-caption">
          <span className="caption-line" />
          <Flower2 size={12} />
          <span>маленький дом · большая любовь</span>
          <span className="caption-line" />
        </div>
      </section>
      <nav
        inert={!!(panel || game || story || s.ending)}
        className="bottom-nav"
        aria-label="Основная навигация"
      >
        {(
          [
            { id: null, label: "Дом", Icon: Home },
            { id: "games", label: "Игры", Icon: Gamepad2 },
            { id: "shop", label: "Магазин", Icon: ShoppingBag },
            { id: "journal", label: "Дневник", Icon: BookHeart },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={label}
            className={
              panel === id || (id === "journal" && panel === "achievements")
                ? "active"
                : ""
            }
            onClick={() => open(id)}
            aria-label={label}
          >
            <Icon size={22} strokeWidth={1.6} />
            <span>{label}</span>
            {id === "journal" && ready > 0 && <i className="nav-dot" />}
          </button>
        ))}
      </nav>
      {panel === "feed" && (
        <FeedSheet
          state={s}
          onClose={() => setPanel(null)}
          onFeed={feed}
          onShop={() => open("shop")}
        />
      )}
      {(panel === "shop" || panel === "wardrobe") && (
        <ShopSheet
          state={s}
          initial={panel === "wardrobe" ? "furniture" : "food"}
          room={room}
          onRoom={setRoom}
          onClose={() => setPanel(null)}
          onBuy={buy}
          onEquip={async (id, targetRoom) => {
            if (await dispatch({ type: "equip", id, room: targetRoom })) {
              setRoom(targetRoom);
              haptic();
            }
          }}
        />
      )}
      {panel === "games" && (
        <Sheet
          title="Время играть"
          eyebrow="Приключения начинаются здесь"
          onClose={() => setPanel(null)}
          kind="games-sheet"
        >
          <p className="sheet-description">
            Вместе веселее. А ещё за игры дают монетки.
          </p>
          <button className="quick-play" onClick={play}>
            <Pixel kind="ball" size={54} />
            <span>
              <strong>Клубочек и лапки</strong>
              <small>Пять минут самого важного — вместе</small>
            </span>
            <Heart size={20} />
          </button>
          <div className="games-list">
            {(
              [
                {
                  id: "jump",
                  title: "Облачный прыжок",
                  desc: "Выше, выше, к облакам",
                  reward: "100 очков = 10 монет",
                  art: "cloud",
                },
                {
                  id: "bounce",
                  title: "Пиксельный отскок",
                  desc: "Лови ритм и разбивай блоки",
                  reward: "До 100 монет за игру",
                  art: "bricks",
                },
                {
                  id: "catch",
                  title: "Фруктовый дождь",
                  desc: "Лови лакомства, береги маленькие лапки",
                  reward: "100 очков = 10 монет",
                  art: "fruit",
                },
                {
                  id: "memory",
                  title: "Найди пару",
                  desc: "Маленькая разминка для памяти",
                  reward: "30 монет за победу",
                  art: "cards",
                },
              ] as const
            ).map((g, i) => (
              <button
                key={g.id}
                className={`game-card game-card-${i}`}
                onClick={() => {
                  if (s.sleeping) {
                    notify("Разбуди питомца, чтобы поиграть");
                    return;
                  }
                  setGame(g.id);
                  setPanel(null);
                  haptic();
                }}
              >
                <div className={`game-illustration ${g.art}`}>
                  {g.art === "cloud" ? (
                    <>
                      <i />
                      <i />
                      <i />
                      <PetImage species={s.species} size={76} />
                    </>
                  ) : g.art === "bricks" ? (
                    <>
                      <b />
                      <b />
                      <b />
                      <b />
                      <b />
                      <b />
                      <Pixel kind="ball" size={40} />
                    </>
                  ) : g.art === "fruit" ? (
                    <>
                      <Pixel kind="strawberry" size={46} />
                      <Pixel kind="pear" size={34} />
                      <PetImage species={s.species} size={58} />
                    </>
                  ) : (
                    <>
                      <span>
                        <Pixel kind="pear" size={43} />
                      </span>
                      <span>
                        <Pixel kind="strawberry" size={43} />
                      </span>
                      <span>
                        <Pixel kind="pear" size={43} />
                      </span>
                    </>
                  )}
                </div>
                <div className="game-card-copy">
                  <h3>{g.title}</h3>
                  <p>{g.desc}</p>
                  <span>
                    <Coins size={14} />
                    {g.reward}
                  </span>
                </div>
                <span className="play-game">
                  <ChevronRight size={21} />
                </span>
              </button>
            ))}
          </div>
          <div className="gentle-note">
            <Leaf size={17} />
            <span>Играйте без спешки. Здесь главное — побыть вместе.</span>
          </div>
        </Sheet>
      )}
      {panel === "journal" && (
        <Sheet
          title="Наш маленький дневник"
          eyebrow="Самое важное — рядом"
          onClose={() => setPanel(null)}
          kind="journal-sheet"
        >
          <div className="pet-profile">
            <div className="profile-art">
              <PetImage
                species={s.species}
                size={108}
                accessory={s.accessory}
              />
              <span>
                <Heart size={14} />
              </span>
            </div>
            <div>
              <span className="eyebrow">{stageNames[stage(s)]}</span>
              <h3>{s.name}</h3>
              <p>
                {speciesNames[s.species].split(" ")[0]} · {level(s)} уровень
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Изменить имя питомца"
              onClick={() => open("settings")}
            >
              <Settings size={19} />
            </button>
          </div>
          <div className="evolution-card">
            <div className="section-row">
              <h3>Растём вместе</h3>
              <span>
                {nextThreshold
                  ? `${s.xp} / ${nextThreshold} XP`
                  : "Особая форма"}
              </span>
            </div>
            <div className="evolution-line">
              <span style={{ width: `${growth}%` }} />
            </div>
            <div className="evolution-stages">
              {stageNames.map((name, i) => (
                <div className={stage(s) >= i ? "reached" : ""} key={name}>
                  <PetImage
                    species={s.species}
                    size={i === 3 ? 50 : 35 + i * 5}
                    stage={i}
                  />
                  <span>{name}</span>
                  <small>{thresholds[i]} XP</small>
                </div>
              ))}
            </div>
            <p>
              {s.stageIndex === 3
                ? "Впереди — две недели вместе, а затем большое путешествие."
                : "Для особой формы нужно 700 XP, три кормления, три игры и три укладывания спать."}
            </p>
          </div>
          <button
            className="achievement-link"
            onClick={() => open("achievements")}
          >
            <span className="achievement-link-icon">
              <Trophy size={24} />
            </span>
            <span>
              <strong>Наши достижения</strong>
              <small>
                {s.claims.length} из 50 маленьких побед
                {ready > 0 ? ` · ${ready} наград ждут` : ""}
              </small>
            </span>
            <ChevronRight size={20} />
          </button>
          <div className="section-row history-heading">
            <h3>Тёплые воспоминания</h3>
            <Clock size={17} />
          </div>
          <div className="timeline">
            {s.history.slice(0, 15).map((entry, i) => (
              <div className="timeline-item" key={`${entry.at}-${i}`}>
                <span className="timeline-dot" />
                <p>
                  {entry.text}
                  <small>
                    {new Date(entry.at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    ·{" "}
                    {new Date(entry.at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </p>
              </div>
            ))}
          </div>
        </Sheet>
      )}
      {panel === "achievements" && (
        <Achievements
          state={s}
          onClose={() => setPanel("journal")}
          onClaim={(id) => {
            dispatch({ type: "claim", id });
            haptic(true);
            sound("reward", s.settings.sound);
          }}
        />
      )}
      {panel === "menu" && (
        <Sheet
          title="Твой маленький мир"
          onClose={() => setPanel(null)}
          kind="menu-sheet"
        >
          <div className="menu-list">
            {[
              {
                label: "Магазин",
                desc: "Всё для уютной жизни",
                Icon: ShoppingBag,
                p: "shop",
              },
              {
                label: "Достижения",
                desc: "50 поводов для гордости",
                Icon: Trophy,
                p: "achievements",
              },
              {
                label: "Настройки",
                desc: "Свет, погода и маленькие детали",
                Icon: Settings,
                p: "settings",
              },
            ].map((row) => (
              <button key={row.p} onClick={() => open(row.p as Panel)}>
                <span>
                  <row.Icon size={23} strokeWidth={1.6} />
                </span>
                <div>
                  <strong>{row.label}</strong>
                  <small>{row.desc}</small>
                </div>
                <ChevronRight size={20} />
              </button>
            ))}
          </div>
          <div className="menu-list menu-list-extra">
            <button onClick={() => open("shared")}>
              <span>
                <Users size={23} />
              </span>
              <div>
                <strong>Общий дом</strong>
                <small>Один питомец и история на двоих</small>
              </div>
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => {
                setPanel(null);
                setStory(true);
              }}
            >
              <span>
                <BookOpen size={23} />
              </span>
              <div>
                <strong>Наше первое знакомство</strong>
                <small>Посмотреть вступление ещё раз</small>
              </div>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="menu-footer">
            <Flower2 size={18} />
            <span>MOCHI</span>
            <small>Каждый день чуть ближе</small>
          </div>
        </Sheet>
      )}
      {panel === "settings" && (
        <SettingsSheet
          state={s}
          onClose={() => setPanel(null)}
          onChange={(value) => dispatch({ type: "settings", value })}
          onRename={async (name) => {
            if (await dispatch({ type: "rename", name }))
              notify("Новое имя сохранено");
          }}
          onCompanion={async (species) => {
            if (await dispatch({ type: "companion", species })) {
              animate("love", "Как же уютно дома!");
              notify("Друг готов. Дом и прогресс сохранены");
              selectVoiceSpecies(species);
              void playCompanionVoice(species, "love", s.settings.sound);
            }
          }}
          onReplay={() => {
            setPanel(null);
            setStory(true);
          }}
          onShared={() => open("shared")}
          onReset={restart}
        />
      )}
      {game && (
        <div
          className="game-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Мини-игра"
        >
          <Game
            kind={game}
            species={s.species}
            motion={s.settings.motion}
            onFinish={(score, coins) => {
              dispatch({
                type: "game",
                game: game!,
                score,
                coins,
                levels: game === "bounce" ? Math.floor(coins / 10) : undefined,
              });
              haptic(true);
              sound("reward", s.settings.sound);
            }}
            onExit={() => {
              setGame(null);
              animate("play", "Вот это мы поиграли!");
              void playCompanionVoice(s.species, "play", s.settings.sound);
              setPanel(null);
            }}
          />
        </div>
      )}
      {panel === "shared" && (
        <Sheet
          title="Наш общий дом"
          eyebrow="Забота становится ближе"
          onClose={() => setPanel(null)}
          kind="shared-sheet"
        >
          <SharedHome
            store={store}
            onDone={() => {
              setPanel(null);
              setStory(false);
            }}
          />
        </Sheet>
      )}
      {s.ending && <Ending state={s} onRestart={restart} />}
      {story && !s.ending && (
        <Prologue
          adopted={s.adopted}
          petName={s.name}
          motion={s.settings.motion}
          sound={s.settings.sound}
          onSettings={() => setPanel("settings")}
          onSound={() => {
            void dispatch({
              type: "settings",
              value: { sound: !s.settings.sound },
            });
          }}
          onFinish={async (species, name) => {
            const ok = await dispatch(
              s.adopted ? { type: "intro" } : { type: "adopt", species, name },
            );
            if (ok) setStory(false);
            return ok;
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </main>
  );
}
function Need({
  title,
  value,
  kind,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  kind: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`need need-${kind}`}
      onClick={onClick}
      aria-label={`${title}: ${Math.round(value)} процентов`}
    >
      <div className="need-label">
        {icon}
        <span>{title}</span>
        <strong>
          {Math.round(value)}
          <small>%</small>
        </strong>
      </div>
      <div className="need-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </button>
  );
}
function FeedSheet({
  state: s,
  onClose,
  onFeed,
  onShop,
}: {
  state: State;
  onClose: () => void;
  onFeed: (id: string) => void;
  onShop: () => void;
}) {
  const available = foods.filter((i) => s.inventory[i.id] > 0);
  const [selected, setSelected] = useState(available[0]?.id || "");
  const item = foods.find((i) => i.id === selected);
  return (
    <Sheet
      title="Что-нибудь вкусненькое?"
      eyebrow="Кладовая"
      onClose={onClose}
      kind="feed-sheet"
    >
      <div className="feeding-preview">
        <PetImage species={s.species} size={98} accessory={s.accessory} />
        <span className="little-heart">
          <Heart size={20} />
        </span>
        {item && <Pixel kind={item.art} size={74} />}
      </div>
      <div className="section-row">
        <h3>Лакомства дома</h3>
        <button className="text-button" onClick={onShop}>
          В магазин
          <ShoppingBag size={14} />
        </button>
      </div>
      {available.length ? (
        <div className="pantry-grid">
          {available.map((i) => (
            <button
              key={i.id}
              className={`pantry-item ${selected === i.id ? "selected" : ""}`}
              onClick={() => setSelected(i.id)}
            >
              <span className="item-quantity">×{s.inventory[i.id]}</span>
              <Pixel kind={i.art} size={70} />
              <span>{i.name}</span>
              <small>+{i.value} сытости</small>
              {selected === i.id && (
                <span className="selected-check">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={32} />
          <h3>Кладовая опустела</h3>
          <p>Заглянем за свежими лакомствами?</p>
          <button className="primary" onClick={onShop}>
            В магазин
          </button>
        </div>
      )}
      <footer className="sheet-sticky">
        <span>
          Сытость сейчас <strong>{Math.round(s.food)}%</strong>
        </span>
        <button
          className="primary"
          disabled={!item}
          onClick={() => item && onFeed(item.id)}
        >
          <Utensils size={18} />
          Угостить{item && <span>+{item.value}</span>}
        </button>
      </footer>
    </Sheet>
  );
}
function ShopSheet({
  state: s,
  initial,
  room,
  onRoom,
  onClose,
  onBuy,
  onEquip,
}: {
  state: State;
  initial: "food" | "furniture";
  room: Room;
  onRoom: (r: Room) => void;
  onClose: () => void;
  onBuy: (i: Item, r: Room) => void;
  onEquip: (id: string, r: Room) => void;
}) {
  const [category, setCategory] = useState<"food" | "furniture" | "accessory">(
      initial,
    ),
    [sort, setSort] = useState("default"),
    [quality, setQuality] = useState("all");
  const qualityOrder = ["common", "uncommon", "rare", "epic", "legend"];
  const labels: Record<string, string> = {
    common: "Обычный",
    uncommon: "Необычный",
    rare: "Редкий",
    epic: "Эпический",
    legend: "Легендарный",
  };
  const list = (
    category === "food"
      ? foods
      : category === "furniture"
        ? furniture
        : accessories
  )
    .filter((i) => quality === "all" || i.quality === quality)
    .slice()
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
          : sort === "quality"
            ? qualityOrder.indexOf(b.quality) - qualityOrder.indexOf(a.quality)
            : 0,
    );
  return (
    <Sheet
      title="Маленькая лавка"
      eyebrow="Собираем уют по кусочкам"
      onClose={onClose}
      kind="shop-sheet"
    >
      <div className="shop-wallet">
        <span>На маленькие радости</span>
        <Coin amount={s.coins} />
      </div>
      <div
        className="category-tabs"
        role="tablist"
        aria-label="Категории магазина"
      >
        {(
          [
            { id: "food", label: "Лакомства", Icon: Leaf },
            { id: "furniture", label: "Для дома", Icon: Armchair },
            { id: "accessory", label: "Образы", Icon: Shirt },
          ] as const
        ).map((c) => (
          <button
            role="tab"
            aria-selected={category === c.id}
            className={category === c.id ? "active" : ""}
            key={c.id}
            onClick={() => {
              setCategory(c.id);
              setQuality("all");
            }}
          >
            <c.Icon size={17} />
            {c.label}
          </button>
        ))}
      </div>
      {category === "furniture" && (
        <div className="shop-room-choice">
          <span>Обустрой комнату</span>
          <div>
            <button
              className={room === "living" ? "selected" : ""}
              onClick={() => onRoom("living")}
            >
              Гостиная
            </button>
            <button
              className={room === "bedroom" ? "selected" : ""}
              onClick={() => onRoom("bedroom")}
            >
              Спальня
            </button>
          </div>
        </div>
      )}
      <div className="catalog-controls">
        <label>
          <span>Сортировка</span>
          <select
            aria-label="Сортировка товаров"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">Наши находки</option>
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
            <option value="quality">По редкости</option>
          </select>
        </label>
        <label>
          <span>Редкость</span>
          <select
            aria-label="Редкость товаров"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            <option value="all">Все находки</option>
            {Object.entries(labels).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-count">
        <span>
          {list.length} {category === "food" ? "лакомств" : "находок"}
        </span>
        <Leaf size={13} />
      </div>
      <div className="shop-grid">
        {list.map((i) => {
          const owned = s.inventory[i.id] > 0,
            equipped =
              i.category === "accessory"
                ? s.accessory === i.id
                : s.rooms[room][i.slot!] === i.id,
            otherRoom: Room = room === "living" ? "bedroom" : "living",
            elsewhere =
              i.category === "furniture" &&
              s.rooms[otherRoom][i.slot!] === i.id,
            needsTable =
              i.category === "furniture" &&
              ["lamp", "tabletop", "lava"].includes(i.slot!) &&
              !s.rooms[room].table;
          return (
            <article className="shop-item" key={i.id}>
              <div className={`product-art product-${category}`}>
                <Pixel
                  kind={i.art}
                  size={category === "furniture" ? 118 : 110}
                />
                <span className={`product-quality quality-${i.quality}`}>
                  {i.rarity}
                </span>
                {owned && (
                  <span className="product-owned">
                    {i.category === "food" ? (
                      "×" + s.inventory[i.id] + " дома"
                    ) : equipped ? (
                      <>
                        <Check size={10} />{" "}
                        {i.category === "accessory" ? "Надето" : "Дома"}
                      </>
                    ) : elsewhere ? (
                      otherRoom === "living" ? (
                        "В гостиной"
                      ) : (
                        "В спальне"
                      )
                    ) : (
                      "Куплено"
                    )}
                  </span>
                )}
              </div>
              <h3>{i.name}</h3>
              <p>{i.description}</p>
              {i.category === "food" ? (
                <span className="nutrition">+{i.value} сытости</span>
              ) : needsTable ? (
                <span className="placement-hint">
                  Для этой вещи нужен столик
                </span>
              ) : (
                <span className="product-space" />
              )}
              {owned && i.category !== "food" ? (
                <button
                  className={`product-buy ${equipped ? "equipped" : ""}`}
                  onClick={() => onEquip(i.id, room)}
                >
                  {i.category === "accessory"
                    ? equipped
                      ? "Снять"
                      : "Надеть"
                    : equipped
                      ? "Убрать"
                      : elsewhere
                        ? "Перенести сюда"
                        : "Поставить"}
                  {equipped ? <Check size={14} /> : <Plus size={14} />}
                </button>
              ) : (
                <button
                  className="product-buy"
                  disabled={s.coins < i.price}
                  onClick={() => onBuy(i, room)}
                  aria-label={`Купить ${i.name} за ${i.price} монет`}
                >
                  <Coin amount={i.price} />
                  <Plus size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Leaf size={30} />
          <p>
            Пока нет находок такой редкости.
            <br />
            Посмотрим остальные?
          </p>
          <button className="text-button" onClick={() => setQuality("all")}>
            Показать все
          </button>
        </div>
      )}
      <p className="shop-bottom">Вещи меняются. Уют остаётся.</p>
    </Sheet>
  );
}
function Achievements({
  state: s,
  onClose,
  onClaim,
}: {
  state: State;
  onClose: () => void;
  onClaim: (id: string) => void;
}) {
  const [filter, setFilter] = useState("Все");
  const list = achievements.filter(
    (a) =>
      filter === "Все" ||
      (filter === "Готово" && achievementValue(s, a) >= a.goal) ||
      (filter === "Редкие" && a.rarity !== "Обычное"),
  );
  return (
    <Sheet
      title="Маленькие большие победы"
      eyebrow={`${s.claims.length} из 50 достижений`}
      onClose={onClose}
      kind="achievements-sheet"
    >
      <div className="achievement-summary">
        <Trophy size={35} strokeWidth={1.5} />
        <p>
          Забота складывается
          <br />
          из маленьких моментов.
        </p>
      </div>
      <div className="category-tabs">
        {["Все", "Готово", "Редкие"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="achievements-list">
        {list.map((a) => {
          const val = achievementValue(s, a),
            done = val >= a.goal,
            claimed = s.claims.includes(a.id);
          return (
            <article
              key={a.id}
              className={`achievement-item ${done ? "unlocked" : ""} ${claimed ? "claimed" : ""}`}
            >
              <div
                className={`achievement-medal ${a.rarity === "Особенное" ? "special" : ""}`}
              >
                {a.metric === "feed" ? (
                  <Utensils size={22} />
                ) : a.metric === "pet" ? (
                  <Heart size={22} />
                ) : a.metric === "games" ? (
                  <Gamepad2 size={22} />
                ) : a.metric === "buy" ? (
                  <ShoppingBag size={22} />
                ) : (
                  <Sun size={22} />
                )}
              </div>
              <div className="achievement-body">
                <small>{a.rarity}</small>
                <h3>{a.title}</h3>
                <p>
                  {a.description}: {Math.min(val, a.goal)} / {a.goal}
                </p>
                <div className="achievement-progress">
                  <span
                    style={{ width: `${Math.min(100, (val / a.goal) * 100)}%` }}
                  />
                </div>
              </div>
              {done && !claimed ? (
                <button
                  className="claim-button"
                  onClick={() => onClaim(a.id)}
                  aria-label={`Забрать награду за ${a.title}`}
                >
                  <Gift size={17} />
                  <span>+{a.reward}</span>
                </button>
              ) : claimed ? (
                <Check size={21} className="claimed-icon" />
              ) : (
                <span className="locked-reward">
                  <Coins size={13} />
                  {a.reward}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </Sheet>
  );
}
function SettingsSheet({
  state: s,
  onClose,
  onChange,
  onRename,
  onReset,
  onReplay,
  onShared,
  onCompanion,
}: {
  state: State;
  onClose: () => void;
  onChange: (v: Partial<State["settings"]>) => void;
  onRename: (v: string) => void;
  onReset: () => void;
  onReplay: () => void;
  onShared: () => void;
  onCompanion: (species: Species) => Promise<void>;
}) {
  const [name, setName] = useState(s.name),
    [reset, setReset] = useState(false),
    [weatherBusy, setWeatherBusy] = useState(false),
    [weatherNote, setWeatherNote] = useState(""),
    [audioNote, setAudioNote] = useState("");
  const loadWeather = async () => {
    if (weatherBusy) return;
    setWeatherBusy(true);
    setWeatherNote("");
    try {
      const forecast = await almatyWeather(true);
      onChange({ ...forecast, weatherMode: "live" });
      setWeatherNote(
        "Алматы · " +
          forecast.temperature +
          "°. Погода обновляется автоматически раз в 15 минут.",
      );
    } catch {
      setWeatherNote(
        "Сейчас нет связи с прогнозом. Выбери погоду вручную — эффекты работают без интернета.",
      );
    } finally {
      setWeatherBusy(false);
    }
  };
  const shortcut = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initData && tg.addToHomeScreen) {
      tg.addToHomeScreen();
    } else
      setWeatherNote(
        "Ярлык можно добавить через меню браузера. В Telegram доступна отдельная кнопка на поддерживаемых устройствах.",
      );
  };
  return (
    <Sheet
      title="Как тебе уютнее?"
      eyebrow="Тихие настройки"
      onClose={onClose}
      kind="settings-sheet"
    >
      <section className="settings-group">
        <h3>Маленький друг</h3>
        <label className="input-label" htmlFor="pet-name">
          Имя питомца
        </label>
        <div className="name-row">
          <input
            className="name-input"
            id="pet-name"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="save-name"
            aria-label="Сохранить имя"
            disabled={!name.trim()}
            onClick={() => onRename(name)}
          >
            <Check size={20} />
          </button>
        </div>
      </section>
      <section className="settings-group">
        <h3>Выбрать друга</h3>
        <div className="companion-picker" aria-label="Питомцы">
          {companionIds.map(
            (sp) => (
              <button
                key={sp}
                className={s.species === sp ? "selected" : ""}
                aria-label={"Выбрать " + speciesNames[sp]}
                aria-pressed={s.species === sp}
                onClick={() => void onCompanion(sp)}
              >
                <PetImage species={sp} size={72} />
                <span>
                  {companions[sp].name}
                </span>
              </button>
            ),
          )}
        </div>
        <p className="settings-hint">Имя, обстановка и прогресс сохранятся.</p>
      </section>
      <section className="settings-group">
        <h3>Свет за окном</h3>
        <div className="period-grid">
          {(
            [
              { id: "auto", label: "По времени", Icon: Clock },
              { id: "day", label: "День", Icon: Sun },
              { id: "sunset", label: "Вечер", Icon: Wind },
              { id: "night", label: "Ночь", Icon: Moon },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              className={s.settings.period === p.id ? "selected" : ""}
              onClick={() => onChange({ period: p.id })}
            >
              <p.Icon size={21} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="settings-group">
        <h3>За нашим окошком</h3>
        <div className="weather-options">
          {(
            [
              { id: "clear", label: "Ясно", Icon: Sun },
              { id: "cloud", label: "Облачно", Icon: Cloud },
              { id: "rain", label: "Дождь", Icon: CloudRain },
              { id: "snow", label: "Снег", Icon: Snowflake },
            ] as const
          ).map((w) => (
            <button
              key={w.id}
              className={s.settings.weather === w.id ? "selected" : ""}
              onClick={() =>
                onChange({
                  weather: w.id,
                  weatherMode: "manual",
                  temperature: null,
                })
              }
            >
              <w.Icon size={20} />
              <span>{w.label}</span>
            </button>
          ))}
        </div>
        <button
          className="weather-refresh"
          disabled={weatherBusy}
          onClick={loadWeather}
        >
          <RotateCcw size={14} />
          {weatherBusy
            ? "Смотрим за окно…"
            : s.settings.weatherMode === "live"
              ? "Обновить погоду Алматы · авто"
              : "Погода Алматы · включить авто"}
        </button>
        {weatherNote && (
          <p className="settings-hint" role="status">
            {weatherNote}
          </p>
        )}
        <a
          className="weather-attribution"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Погодные данные Open-Meteo
        </a>
      </section>
      <section className="settings-group">
        <Toggle
          title="Звуки дома"
          description="Свой голос у каждого питомца и звуки маленьких событий"
          checked={s.settings.sound}
          onChange={() => {
            onChange({ sound: !s.settings.sound });
            sound("tap", !s.settings.sound);
          }}
          icon={
            s.settings.sound ? <Volume2 size={21} /> : <VolumeX size={21} />
          }
        />
        <div className="sound-settings">
          <label htmlFor="sound-volume">
            Громкость <strong>{Math.round(s.settings.volume * 100)}%</strong>
          </label>
          <input
            id="sound-volume"
            aria-label="Громкость звука"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(s.settings.volume * 100)}
            onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
          />
          <button
            className="sound-test"
            onClick={async () => {
              if (s.settings.volume <= 0) {
                setAudioNote("Подними громкость ползунком, чтобы услышать питомца.");
                return;
              }
              onChange({ sound: true });
              const ok = await previewCompanionVoice(s.species);
              setAudioNote(
                ok
                  ? companionProfiles[s.species].voice + ". Звук включён."
                  : "Браузер не разрешил звук. Проверь громкость устройства и повтори касание.",
              );
            }}
          >
            <Volume2 size={17} />
            Послушать питомца
          </button>
          {audioNote && (
            <p role="status" className="settings-hint">
              {audioNote}
            </p>
          )}
        </div>
        <Toggle
          title="Звуки за окном"
          description="Спокойный дождь, птицы днём и сверчки ночью"
          checked={s.settings.ambience}
          onChange={() => onChange({ ambience: !s.settings.ambience })}
          icon={<Wind size={21} />}
        />
        <Toggle
          title="Живые детали"
          description="Дыхание, пылинки и мягкий свет"
          checked={s.settings.motion}
          onChange={() => onChange({ motion: !s.settings.motion })}
          icon={<Sparkles size={21} />}
        />
      </section>
      <section className="settings-group">
        <button className="settings-link" onClick={onReplay}>
          <BookOpen size={20} />
          <span>
            <strong>Наше первое знакомство</strong>
            <small>Посмотреть вступление без сброса игры</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button className="settings-link" onClick={onShared}>
          <Users size={20} />
          <span>
            <strong>Общий дом</strong>
            <small>Заботиться о питомце вдвоём</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button className="settings-link" onClick={shortcut}>
          <Home size={20} />
          <span>
            <strong>Всегда рядом</strong>
            <small>Добавить ярлык на главный экран</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <PhoneWidgetSetup state={s}/>
      <section className="settings-group reset-group">
        <button className="text-button" onClick={() => setReset((v) => !v)}>
          <RotateCcw size={16} />
          Начать новую историю
        </button>
        {reset && (
          <div className="reset-confirm">
            <p>
              Сохранение этого питомца, покупки и монеты на этом устройстве
              будут заменены новой историей.
            </p>
            <button className="primary" onClick={onReset}>
              Начать сначала
            </button>
            <button className="text-button" onClick={() => setReset(false)}>
              Оставить нашу историю
            </button>
          </div>
        )}
      </section>
      <p className="settings-version">MOCHI · маленькие радости каждый день</p>
    </Sheet>
  );
}
function Toggle({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      className="toggle-row"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      {icon}
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <i className={`switch ${checked ? "on" : ""}`} />
    </button>
  );
}
