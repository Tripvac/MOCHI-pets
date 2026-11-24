import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { act, normalize, progress, pets } from '../shared/game.mjs';

const allowed = new Set(['feed','pet','play','sleep','buy','equip','game','claim','rename','companion']);
const err = (status, message, state) => Object.assign(new Error(message), {status,state});
const hashCode = code => createHash('sha256').update(code).digest('hex');
function env() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!url || !key || !token) throw err(503, 'Общий дом ещё не настроен на сервере.');
  return {url: url.replace(/\/$/, ''),key,token};
}
export function telegramUser(raw, token, now = Date.now()) {
  if (typeof raw !== 'string' || !raw || raw.length > 16000) throw err(401,'Открой игру внутри Telegram.');
  const p = new URLSearchParams(raw);
  const hash = p.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || new Set(p.keys()).size !== [...p.keys()].length) throw err(401,'Не удалось проверить вход Telegram.');
  p.delete('hash'); p.sort();
  const check = [...p].map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256','WebAppData').update(token).digest();
  const expected = createHmac('sha256',secret).update(check).digest();
  if (!timingSafeEqual(Buffer.from(hash,'hex'),expected)) throw err(401,'Не удалось проверить вход Telegram.');
  const age = now/1000 - Number(p.get('auth_date'));
  if (!p.get('auth_date') || !Number.isFinite(age) || age < -60 || age > 86400) throw err(401,'Закрой и снова открой игру в Telegram.');
  let user; try {user = JSON.parse(p.get('user'));} catch {}
  if (!Number.isSafeInteger(user?.id) || user.id <= 0) throw err(401,'Telegram не передал пользователя.');
  return {id: String(user.id), name: String(user.first_name || 'Друг').slice(0,24)};
}
async function db(config, method, filters={}, data) {
  const q = new URLSearchParams(filters);
  const url = `${config.url}/rest/v1/mochi_houses?${q}`;
  const headers = {apikey:config.key, 'Content-Type':'application/json', Prefer:'return=representation'};
  if (!config.key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${config.key}`;
  let r; try {r=await fetch(url,{method,headers,body:data === undefined ? undefined : JSON.stringify(data), signal:AbortSignal.timeout(4500)});} catch {throw err(503,'База временно недоступна. Попробуй ещё раз.');}
  if (!r.ok) {console.error('MOCHI database HTTP',r.status); throw err(503,'Не удалось сохранить или получить общий дом.');}
  return r.json();
}
const read = async (c,code) => (await db(c,'GET',{code_hash:`eq.${hashCode(code)}`,select:'state,version,requests',limit:'1'}))[0];
const save = async (c,code,row,state,requests) => (await db(c,'PATCH',{code_hash:`eq.${hashCode(code)}`,version:`eq.${row.version}`,select:'version'},{state,requests,version:Number(row.version)+1,updated_at:new Date().toISOString()})).length === 1;
function reply(res,status,data) {res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data);}
function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') {if(b.length>150000) throw err(413,'Слишком большой запрос.');try{b=JSON.parse(b);}catch{throw err(400,'Некорректный запрос.');}}
  if (!b || typeof b !== 'object' || Array.isArray(b) || JSON.stringify(b).length>150000) throw err(400,'Некорректный запрос.');
  return b;
}
export function handler(route) {return async (req,res) => {
  try {
    if (req.method !== (route==='health'?'GET':'POST')) return reply(res,405,{error:'Метод не поддерживается.'});
    const c=env();
    if (route==='health') {await db(c,'GET',{select:'id',limit:'1'});return reply(res,200,{sharing:true,version:4});}
    const b=parseBody(req);
    const user=telegramUser(req.headers['x-telegram-init-data'],c.token);
    const actor=typeof b.actor==='string'?b.actor.trim().slice(0,24)||user.name:user.name;
    if (route==='create') {
      if (!b.state?.adopted || !Object.hasOwn(pets,b.state.species)) throw err(400,'Выбери питомца.');
      // The owner's local save is explicitly imported; this is a private, non-competitive game.
      const state=progress(normalize(b.state)); delete state.error;
      const code=randomBytes(12).toString('hex');
      await db(c,'POST',{}, {code_hash:hashCode(code),state,version:0,requests:{members:[user.id],ids:[]}});
      return reply(res,200,{code,state});
    }
    if (typeof b.code!=='string'|| !/^[a-f0-9]{24}$/.test(b.code)) throw err(404,'Дом не найден. Проверь код.');
    if (route==='action' && (typeof b.requestId!=='string'||!b.requestId||b.requestId.length>100||!allowed.has(b.action?.type)||!Number.isSafeInteger(b.expectedVersion))) throw err(400,'Недопустимое действие.');
    for(let retry=0;retry<4;retry++) {
      const row=await read(c,b.code);
      if(!row) throw err(404,'Дом не найден. Проверь код.');
      const state=normalize(row.state);
      const members=row.requests?.members, ids=row.requests?.ids;
      if (!Array.isArray(members)||!Array.isArray(ids)) throw err(409,'Нужна миграция старого дома.');
      const member=members.includes(user.id);
      if(route==='state') {
        if(member) return reply(res,200,{state:progress(state)});
        if(members.length>=2) throw err(403,'В этом доме уже два хозяина.');
        if(await save(c,b.code,row,state,{members:[...members,user.id],ids})) return reply(res,200,{state:progress(state)});
        continue;
      }
      if(!member) throw err(403,'Сначала присоединись к дому.');
      if(ids.includes(b.requestId)) return reply(res,200,{state:progress(state),duplicate:true});
      if(b.expectedVersion!==state.rev) throw err(409,'История обновилась. Повторяем действие.',progress(state));
      let next;
      try {next=act(state,{...b.action,actor:typeof b.action.actor==='string'?b.action.actor.trim().slice(0,24)||user.name:actor});} catch(e) {throw err(400,String(e.message||e).slice(0,200));}
      if(await save(c,b.code,row,next,{members,ids:[...ids,b.requestId].slice(-300)})) return reply(res,200,{state:next});
    }
    throw err(503,'Дом обновляется. Попробуй ещё раз.');
  } catch(e) {
    if(!e.status) console.error('MOCHI API unexpected error',e.name);
    return reply(res,e.status||500,{error:e.status?e.message:'Ошибка сервера общего дома.',...(e.state?{state:e.state}:{})});
  }
};}
