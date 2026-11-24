// Shared rules restored from the supplied MOCHI archive and extended for the merged client.
// This module has no DOM dependencies and is used by the client and the LAN server.
import { catalog, byId } from "./catalog.mjs";
import { companions } from "./companions.mjs";
export { catalog, byId };
export const H = 3600000,
  D = 24 * H;
export const thresholds = [0, 100, 300, 700];
export const stageNames = ["Малыш", "Подросток", "Взрослый", "Особая форма"];
export const pets = companions;
export const qualityNames = {
  common: "Обычный",
  uncommon: "Необычный",
  rare: "Редкий",
  epic: "Эпический",
  legend: "Легендарный",
};
const groups = [
  ["feed", "Заботливые лапки", "Покормить питомца", [1, 5, 15, 30, 60]],
  ["play", "Лучший друг", "Поиграть вместе", [1, 5, 15, 30, 60]],
  ["sleep", "Сладкие сны", "Уложить спать", [1, 3, 10, 20, 40]],
  ["buy", "Любитель покупок", "Купить предметы", [1, 3, 8, 15, 30]],
  ["decorate", "Наш уютный дом", "Разместить мебель", [1, 3, 8, 15, 30]],
  ["games", "Игровой мастер", "Завершить мини-игры", [1, 3, 10, 20, 50]],
  [
    "earned",
    "Золотая копилка",
    "Заработать монеты",
    [10, 100, 500, 1500, 5000],
  ],
  ["xp", "Большие перемены", "Набрать опыт", [20, 100, 300, 700, 1500]],
  ["pet", "Нежность", "Погладить питомца", [1, 5, 20, 50, 100]],
  ["days", "Наша история", "Дней вместе", [1, 3, 7, 14, 30]],
];
const qualities = Object.keys(qualityNames);
export const achievements = groups.flatMap(
  ([metric, title, description, goals]) =>
    goals.map((goal, i) => ({
      id: metric + i,
      metric,
      title: title + " " + ["I", "II", "III", "IV", "V"][i],
      description,
      goal,
      reward: 20 + i * 20,
      quality: qualities[i],
      rarity: qualityNames[qualities[i]],
    })),
);
export const clamp = (v) => Math.max(0, Math.min(100, v));
const clone = (x) => JSON.parse(JSON.stringify(x));
const today = (now) => new Date(now).toISOString().slice(0, 10);
export function fresh(now = Date.now()) {
  return {
    version: 3,
    roomEdition: 4,
    name: companions.cat.default,
    species: "cat",
    coins: 1000,
    xp: 0,
    food: 80,
    energy: 80,
    joy: 80,
    sleeping: false,
    sleepStarted: 0,
    inventory: {
      apple: 2,
      berry: 2,
      milk: 1,
      rug: 1,
      box: 1,
      table: 1,
      chair: 1,
      bedpink: 1,
      rugblue: 1,
      plant: 1,
      lamp: 1,
      books: 1,
      wave: 1,
    },
    rooms: {
      living: {
        rug: "rug",
        toy: "box",
        table: "table",
        sofa: "chair",
        plant: "plant",
        lamp: "lamp",
        shelf: "books",
        poster: "wave",
      },
      bedroom: { bed: "bedpink", rug: "rugblue" },
    },
    accessory: "",
    counts: {
      feed: 0,
      play: 0,
      pet: 0,
      games: 0,
      buy: 0,
      sleep: 0,
      decorate: 0,
      earned: 0,
      score: 0,
    },
    claims: [],
    unlocked: [],
    days: [today(now)],
    lastSeen: now,
    lastFed: now,
    lastActions: {},
    createdAt: now,
    history: [],
    stageIndex: 0,
    superAt: null,
    ending: null,
    adopted: false,
    introSeen: false,
    rev: 0,
    settings: {
      period: "auto",
      weather: "clear",
      weatherMode: "manual",
      temperature: null,
      weatherAt: 0,
      volume: 0.65,
      ambience: true,
      motion: true,
      sound: true,
    },
  };
}
const aliases = {
  strawberry: "berry",
  watermelon: "melon",
  headphones: "phones",
  picture: "wave",
  rugrect: "rugrect",
};
export function normalize(input, now = Date.now()) {
  if (!input || typeof input !== "object" || !pets[input.species])
    return fresh(now);
  const b = fresh(now),
    legacy = input.version === 1;
  const s = {
    ...b,
    ...input,
    version: 3,
    counts: { ...b.counts, ...(input.counts || input.counters || {}) },
    settings: { ...b.settings, ...(input.settings || {}) },
    rooms: { living: {}, bedroom: {} },
    lastActions: { ...(input.lastActions || input.lastAction || {}) },
    claims: Array.isArray(input.claims)
      ? input.claims.map((id) => id.replace(/^([a-z]+)-(\d)$/, "$1$2"))
      : [],
    unlocked: Array.isArray(input.unlocked) ? input.unlocked : [],
    inventory: {},
    history: Array.isArray(input.history) ? input.history.slice(0, 80) : [],
    days: Array.isArray(input.days) ? input.days : [today(now)],
  };
  s.name = String(input.name || pets[s.species].default).slice(0, 24);
  s.createdAt = Number(input.createdAt || input.created || now);
  s.lastSeen = Number(input.lastSeen || input.updated || now);
  s.lastFed = Number(input.lastFed || s.lastSeen);
  s.energy = clamp(Number(input.energy ?? input.sleep ?? 80));
  s.joy = clamp(Number(input.joy ?? input.fun ?? 80));
  s.food = clamp(Number(input.food ?? 80));
  s.coins = Math.max(0, Number(input.coins) || 0);
  s.xp = Math.max(0, Number(input.xp) || 0);
  for (const [id, n] of Object.entries(input.inventory || {})) {
    const mapped = aliases[id] || id;
    if (byId[mapped])
      s.inventory[mapped] =
        (s.inventory[mapped] || 0) + Math.max(0, Math.floor(Number(n) || 0));
  }
  const oldRooms = input.rooms || { living: input.equipped || {}, bedroom: {} };
  for (const room of ["living", "bedroom"])
    for (const id of Object.values(oldRooms[room] || {})) {
      const mapped = aliases[id] || id,
        i = byId[mapped];
      if (i && i.category === "furniture" && s.inventory[mapped])
        s.rooms[room][i.slot] = mapped;
    }
  // Lava lamps used to replace the ordinary desk lamp. Move the installed
  // lava lamp into its new adjacent slot and restore the owned desk lamp once.
  for (const room of ["living", "bedroom"]) {
    if (
      String(oldRooms[room]?.lamp || "").startsWith("lava") &&
      s.rooms[room].lava &&
      s.inventory.lamp &&
      !s.rooms[room].lamp &&
      !Object.values(s.rooms).some((r) => Object.values(r).includes("lamp"))
    )
      s.rooms[room].lamp = "lamp";
  }
  // Earlier room backgrounds contained furniture. Preserve that furnished
  // starting point when moving to the new architecture with separate sprites.
  if (input.version !== 3 || input.roomEdition !== 4) {
    for (const room of ["living", "bedroom"])
      for (const [slot, id] of Object.entries(b.rooms[room])) {
        s.inventory[id] = Math.max(1, s.inventory[id] || 0);
        const alreadyPlaced =
          Object.values(s.rooms.living).includes(id) ||
          Object.values(s.rooms.bedroom).includes(id);
        if (!s.rooms[room][slot] && !alreadyPlaced) s.rooms[room][slot] = id;
      }
  }
  s.roomEdition = 4;
  s.accessory = aliases[input.accessory] || input.accessory || "";
  if (!s.inventory[s.accessory] || byId[s.accessory]?.category !== "accessory")
    s.accessory = "";
  s.stageIndex = Math.min(
    3,
    Math.max(
      0,
      Number(
        input.stageIndex ??
          (legacy
            ? input.stage
            : Math.floor(
                s.xp >= 1200 ? 3 : s.xp >= 700 ? 2 : s.xp >= 300 ? 1 : 0,
              )),
      ) || 0,
    ),
  );
  s.adopted = legacy ? true : !!input.adopted;
  s.introSeen = input.version === 3 ? !!input.introSeen : false;
  s.ending = ["left", "graduated"].includes(input.ending) ? input.ending : null;
  s.superAt = input.superAt || (s.stageIndex === 3 ? s.lastSeen : null);
  s.rev = Math.max(0, Number(input.rev) || 0);
  if (
    !Number.isFinite(s.createdAt) ||
    !Number.isFinite(s.lastSeen) ||
    !Number.isFinite(s.lastFed)
  )
    return fresh(now);
  return progress(s, now);
}
export function achievementValue(s, a) {
  if (a.metric === "xp") return s.xp;
  if (a.metric === "days")
    return Math.max(1, Math.floor((s.lastSeen - s.createdAt) / D) + 1);
  return s.counts[a.metric] || 0;
}
export function progress(original, now = Date.now()) {
  const s = clone(original);
  if (!s.adopted || s.ending) {
    s.lastSeen = Math.max(s.lastSeen, now);
    return s;
  }
  const hours = Math.max(0, (now - s.lastSeen) / H),
    hunger = Math.max(0, (now - s.lastFed) / H);
  s.food = clamp(s.food - hours * 1.45);
  s.joy = clamp(s.joy - hours * 0.7);
  s.energy = clamp(s.energy + hours * (s.sleeping ? 13 : -1.1));
  if (s.sleeping && s.energy >= 100) {
    s.sleeping = false;
    s.sleepStarted = 0;
  }
  s.lastSeen = Math.max(now, s.lastSeen);
  if (!s.days.includes(today(now))) s.days.push(today(now));
  if (hunger >= 168) {
    s.ending = "left";
    return s;
  }
  if (s.superAt && now - s.superAt >= 14 * D) {
    s.ending = "graduated";
    return s;
  }
  if (hunger < 72 && s.food >= 30) {
    while (
      s.stageIndex < 3 &&
      s.xp >= thresholds[s.stageIndex + 1] &&
      (s.stageIndex !== 2 ||
        Math.min(s.counts.feed, s.counts.play, s.counts.sleep) >= 3)
    ) {
      s.stageIndex++;
      if (s.stageIndex === 3) s.superAt = now;
    }
  }
  for (const a of achievements)
    if (achievementValue(s, a) >= a.goal && !s.unlocked.includes(a.id))
      s.unlocked.push(a.id);
  return s;
}
export function act(original, a, now = Date.now()) {
  if (a.type === "replace") return normalize(a.state, now);
  if (a.type === "reset") return fresh(now);
  const s = progress(original, now);
  delete s.error;
  if (a.type === "tick") return s;
  if (a.type === "settings") {
    s.settings = { ...s.settings, ...a.value };
    return s;
  }
  if (a.type === "intro") {
    s.introSeen = true;
    return s;
  }
  if (a.type === "adopt") {
    if (!pets[a.species]) throw Error("Выбери маленького друга.");
    s.species = a.species;
    s.name =
      String(a.name || pets[a.species].default)
        .trim()
        .slice(0, 24) || pets[a.species].default;
    s.adopted = true;
    s.introSeen = true;
    s.createdAt = now;
    s.lastFed = now;
    s.lastSeen = now;
    s.history = [
      {
        text: s.name + " поселился в своём маленьком доме",
        at: now,
        actor: a.actor || "Ты",
      },
    ];
    return progress(s, now);
  }
  if (a.type === "rename") {
    const name = String(a.name || "")
      .trim()
      .slice(0, 24);
    if (!name) throw Error("Имя не должно быть пустым.");
    s.name = name;
    s.rev++;
    return s;
  }
  if (a.type === "companion") {
    if (!pets[a.species]) throw Error("Выбери питомца.");
    const oldDefault = pets[s.species].default;
    s.species = a.species;
    if (s.name === oldDefault) s.name = pets[a.species].default;
    s.rev++;
    return s;
  }
  if (s.ending) throw Error("Эта история завершена. Можно начать новую.");
  if (!s.adopted) throw Error("Сначала познакомься с питомцем.");
  const id = aliases[a.id] || a.id,
    item = byId[id];
  let text = "";
  const cooldown = (key, seconds) => {
    if (now - (s.lastActions[key] || 0) < seconds * 1000)
      throw Error("Дай питомцу немного времени.");
    s.lastActions[key] = now;
  };
  const equip = (i, room) => {
    if (!["living", "bedroom"].includes(room)) throw Error("Выбери комнату.");
    if (["lamp", "tabletop", "lava"].includes(i.slot) && !s.rooms[room].table)
      throw Error("Для этой вещи сначала поставим столик.");
    if (s.rooms[room][i.slot] === i.id) {
      delete s.rooms[room][i.slot];
      if (i.slot === "table") {
        delete s.rooms[room].lamp;
        delete s.rooms[room].tabletop;
        delete s.rooms[room].lava;
      }
    } else {
      for (const r of Object.values(s.rooms))
        for (const [slot, value] of Object.entries(r))
          if (value === i.id) {
            delete r[slot];
            if (i.slot === "table") {
              delete r.lamp;
              delete r.tabletop;
              delete r.lava;
            }
          }
      s.rooms[room][i.slot] = i.id;
      s.counts.decorate++;
    }
  };
  switch (a.type) {
    case "feed":
      if (s.sleeping) throw Error("Сначала разбуди питомца.");
      if (!item || item.category !== "food" || !s.inventory[id])
        throw Error("Лакомство закончилось.");
      if (s.food >= 99.5) throw Error(s.name + " пока сыт. Оставим на потом?");
      cooldown("feed", 2);
      s.inventory[id]--;
      s.food = clamp(s.food + item.value);
      s.joy = clamp(s.joy + 3);
      s.lastFed = now;
      s.counts.feed++;
      s.xp += 12;
      text = "Угостили: " + item.name;
      break;
    case "pet":
      if (s.sleeping) throw Error("Тсс… пусть ещё немного поспит.");
      cooldown("pet", 8);
      s.joy = clamp(s.joy + 3);
      s.counts.pet++;
      s.xp += 2;
      text = "Побыли рядом и погладили питомца";
      break;
    case "play":
      if (s.sleeping || s.energy < 10) throw Error("Сначала нужно отдохнуть.");
      if (s.joy >= 99.5)
        throw Error("Радости уже через край. Поиграем чуть позже.");
      cooldown("play", 20);
      s.joy = clamp(s.joy + 18);
      s.energy = clamp(s.energy - 8);
      s.counts.play++;
      s.xp += 12;
      text = "Поиграли вместе с клубочком";
      break;
    case "sleep":
      if (s.sleeping) {
        s.sleeping = false;
        s.sleepStarted = 0;
        text = "Проснулись и потянулись";
        break;
      }
      if (s.energy >= 98) throw Error(s.name + " ещё не устал.");
      cooldown("sleep", 30);
      s.sleeping = true;
      s.sleepStarted = now;
      s.counts.sleep++;
      s.xp += 10;
      text = "Устроились спать";
      break;
    case "buy":
      if (!item) throw Error("Не удалось найти предмет.");
      if (item.category !== "food" && s.inventory[id])
        throw Error("Эта вещь уже есть дома.");
      if (s.coins < item.price)
        throw Error("Немного не хватает монет. Заглянем в игры?");
      s.coins -= item.price;
      s.inventory[id] = (s.inventory[id] || 0) + 1;
      s.counts.buy++;
      if (a.autoEquip && item.category === "furniture")
        equip(item, a.room || "living");
      if (a.autoEquip && item.category === "accessory") s.accessory = id;
      text = "В доме появилась новая вещь: " + item.name;
      break;
    case "equip":
      if (!item || !s.inventory[id] || item.category === "food")
        throw Error("Сначала нужно купить эту вещь.");
      if (item.category === "accessory")
        s.accessory = s.accessory === id ? "" : id;
      else equip(item, a.room || "living");
      text = "Изменили интерьер или образ: " + item.name;
      break;
    case "claim": {
      const ach = achievements.find((i) => i.id === a.id);
      if (!ach || achievementValue(s, ach) < ach.goal)
        throw Error("У этой маленькой победы ещё всё впереди.");
      if (s.claims.includes(ach.id)) throw Error("Награда уже получена.");
      s.claims.push(ach.id);
      s.coins += ach.reward;
      text = "Маленькая победа: " + ach.title;
      break;
    }
    case "game": {
      if (s.sleeping) throw Error("Питомец ещё спит.");
      if (
        !["jump", "bounce", "catch", "memory"].includes(a.game) ||
        !Number.isInteger(a.score) ||
        a.score < 0
      )
        throw Error("Не удалось проверить результат.");
      cooldown("game", 3);
      const score = Math.min(10000, a.score),
        completed = Math.max(
          0,
          Math.min(10, Number.isInteger(a.levels) ? a.levels : 0),
        );
      const coins =
        a.game === "bounce"
          ? completed * 10
          : a.game === "memory"
            ? 30
            : Math.floor(score / 100) * 10;
      s.coins += coins;
      s.counts.games++;
      s.counts.play++;
      s.counts.earned += coins;
      s.counts.score = Math.max(s.counts.score, score);
      s.joy = clamp(s.joy + 15);
      s.energy = clamp(s.energy - 4);
      s.xp += 8;
      text = "Поиграли вместе и получили " + coins + " монет";
      break;
    }
    default:
      throw Error("Неизвестное действие.");
  }
  s.history.unshift({
    text,
    at: now,
    actor: String(a.actor || "Ты").slice(0, 24),
  });
  s.history = s.history.slice(0, 80);
  s.rev++;
  return progress(s, now);
}
