export const petNames = {
  cat: "Максвелл", rabbit: "Луна", dog: "Пончик", hamster: "Пико",
  pusheen: "Пушин", capybara: "Капи", cheems: "Чимс",
};
export const petLabels = {
  cat: "Максвелл", rabbit: "Кролик Луна", dog: "Такса Пончик", hamster: "Хомяк Пико",
  pusheen: "Пушин", capybara: "Капибара Капи", cheems: "Чимс",
};
export const defaultPreferences = {species: "auto", mode: "pet"};

function validPNG(value) {
  if (typeof value !== "string" || value.length > 700000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes=[];let bits=0, count=0;
  for(const letter of value.slice(0,32)) {
    bits=(bits<<6)|alphabet.indexOf(letter);count+=6;
    if(count>=8){count-=8;bytes.push((bits>>count)&255);}
  }
  if(bytes.length<24 || [137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v)) return false;
  const dimension=offset=>bytes.slice(offset,offset+4).reduce((n,b)=>n*256+b,0);
  return dimension(16)>0 && dimension(16)<=512 && dimension(20)>0 && dimension(20)<=512;
}
export function validateDocument(value, now = Date.now()) {
  if (!value || value.schema!==1 || !Object.hasOwn(petNames,value.species) ||
      typeof value.name!=="string" || value.name.length>80 || typeof value.adopted!=="boolean" ||
      !Number.isFinite(value.generatedAt) || value.generatedAt<=0 || value.generatedAt>now+300000 ||
      !Number.isFinite(value.validUntil) || value.validUntil<=value.generatedAt ||
      value.validUntil-value.generatedAt>49*3600000 || !Array.isArray(value.frames) ||
      !value.frames.length || value.frames.length>100) return false;
  let last=value.generatedAt-1;
  for(const frame of value.frames) {
    if(!Number.isFinite(frame.at) || frame.at<=last || frame.at>value.validUntil ||
       ![frame.food,frame.energy,frame.joy].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||
       typeof frame.sleeping!=="boolean" || ![null,"left","graduated"].includes(frame.ending)) return false;
    last=frame.at;
  }
  if(value.portraits && (!validPNG(value.portraits.awake)||!validPNG(value.portraits.asleep))) return false;
  return true;
}
export function parseDocument(text, now = Date.now()) {
  if (typeof text!=="string" || text.length>1600000) throw Error("Скопируй данные через настройки MOCHI.");
  let value;
  try {value=JSON.parse(text);} catch {throw Error("В буфере нет данных MOCHI. В игре нажми «Передать потребности».");}
  if(!validateDocument(value,now)) throw Error("Это не сохранение виджета MOCHI или данные повреждены.");
  return value;
}
export function preferences(value) {
  return {
    species:value?.species==="auto"||Object.hasOwn(petNames,value?.species||"")?value.species:"auto",
    mode:["pet","needs","both"].includes(value?.mode)?value.mode:"pet",
  };
}
export function widgetState(document, prefs, parameter="", now=Date.now()) {
  const parts=String(parameter||"").toLowerCase().trim().split(/[,:;\s]+/);
  const forcedPet=parts.find(p=>Object.hasOwn(petNames,p));
  const forcedMode=parts.find(p=>["pet","needs","both"].includes(p));
  const chosen=forcedPet || (prefs.species!=="auto"?prefs.species:null);
  const species=chosen||document?.species||"pusheen";
  const applicable=!!document && document.species===species && document.adopted;
  const frame=applicable?[...document.frames].reverse().find(f=>f.at<=now)||document.frames[0]:null;
  const stale=applicable && now>document.validUntil;
  return {
    species, name:applicable?document.name:petNames[species], mode:forcedMode||prefs.mode,
    frame:stale?null:frame, stale, hasData:applicable, generatedAt:applicable?document.generatedAt:null,
    portrait:applicable?document.portraits?.[!stale&&frame?.sleeping?"asleep":"awake"]:null,
    sleeping:!stale&&!!frame?.sleeping,
  };
}
