import { petNames, petLabels, defaultPreferences, preferences, parseDocument, validateDocument, widgetState } from "./core.mjs";
const ASSETS = __MOCHI_WIDGET_ASSETS__;
const GAME_URL = "https://mochi-little-home.nikiforovdaniil0211.chatgpt.site/";
const palette = {background:"1E3247",cream:"FFF5DD",muted:"BCC4C5",food:"EB9D75",energy:"A8BDED",joy:"B8CF89"};

function text(parent,value,size,color=palette.cream,weight="regular") {
  const view=parent.addText(String(value));
  view.font=weight==="bold"?Font.boldSystemFont(size):weight==="medium"?Font.mediumSystemFont(size):Font.systemFont(size);
  view.textColor=new Color(color);view.lineLimit=1;view.minimumScaleFactor=.8;
  return view;
}
function centeredText(parent,value,size,color=palette.cream,weight="regular") {
  const row=parent.addStack();row.layoutHorizontally();row.addSpacer();
  const view=text(row,value,size,color,weight);row.addSpacer();return view;
}
function portrait(parent,state,width,height) {
  const encoded=state.portrait||ASSETS[state.species+(state.sleeping?"-sleep":"")];
  let image;
  try {image=Image.fromData(Data.fromBase64String(encoded));}
  catch {image=Image.fromData(Data.fromBase64String(ASSETS.pusheen));}
  const view=parent.addImage(image);view.imageSize=new Size(width,height);view.applyFittingContentMode();
  return view;
}
function bar(value,width,color) {
  const context=new DrawContext();context.size=new Size(width,5);context.opaque=false;context.respectScreenScale=true;
  context.setFillColor(new Color("FFFFFF",.13));context.fillRect(new Rect(0,0,width,5));
  if(value!==null){context.setFillColor(new Color(color));context.fillRect(new Rect(0,0,width*Math.max(0,Math.min(100,value))/100,5));}
  return context.getImage();
}
function needs(parent,state,width) {
  const rows=[["food","Еда"],["energy","Сон"],["joy","Игры"]];
  for(const [index,[key,label]] of rows.entries()) {
    const value=state.frame?Math.round(state.frame[key]):null;
    const outer=parent.addStack();outer.layoutHorizontally();outer.addSpacer();
    const column=outer.addStack();column.layoutVertically();column.spacing=3;column.size=new Size(width,0);outer.addSpacer();
    const row=column.addStack();row.layoutHorizontally();
    text(row,label,13,palette[key],"medium");row.addSpacer();
    text(row,value===null?"—":value+"%",13,palette[key],"bold");
    const meter=column.addImage(bar(value,width,palette[key]));meter.imageSize=new Size(width,4);
    if(index<2)parent.addSpacer(5);
  }
}
export function buildWidget(document,prefs,parameter="",family="small") {
  const state=widgetState(document,prefs,parameter);
  const widget=new ListWidget();widget.backgroundColor=new Color(palette.background);
  widget.setPadding(13,14,13,14);widget.url=GAME_URL;
  widget.refreshAfterDate=new Date(Date.now()+30*60*1000);
  if(state.mode==="pet") {
    widget.addSpacer();
    const row=widget.addStack();row.layoutHorizontally();row.addSpacer();
    portrait(row,state,family==="large"?220:family==="medium"?180:112,family==="large"?205:96);row.addSpacer();
    widget.addSpacer(7);centeredText(widget,state.name,family==="small"?15:18,palette.cream,"medium");
    widget.addSpacer();
    return widget;
  }
  centeredText(widget,state.name,15,palette.cream,"bold");widget.addSpacer(7);
  if(state.mode==="both" && family!=="small") {
    const row=widget.addStack();row.layoutHorizontally();row.centerAlignContent();row.addSpacer();
    portrait(row,state,96,100);row.addSpacer(16);
    const column=row.addStack();column.layoutVertically();needs(column,state,140);row.addSpacer();
  } else needs(widget,state,family==="small"?110:252);
  widget.addSpacer();
  const stamp=state.generatedAt?new Date(state.generatedAt).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}):null;
  text(widget,state.stale?"Обнови данные из игры":!state.hasData?"Передай данные из MOCHI":"Сохранение · "+stamp,10,palette.muted);
  return widget;
}

async function notice(title,message) {
  const alert=new Alert();alert.title=title;alert.message=message;alert.addAction("Понятно");await alert.presentAlert();
}
async function choice(title,values) {
  const alert=new Alert();alert.title=title;values.forEach(value=>alert.addAction(value));alert.addCancelAction("Отмена");
  return await alert.presentSheet();
}
function storage() {
  const fm=FileManager.local(), root=fm.joinPath(fm.documentsDirectory(),"MOCHI-Widget");
  if(!fm.fileExists(root))fm.createDirectory(root,true);
  return {read(name){try{return JSON.parse(fm.readString(fm.joinPath(root,name)));}catch{return null;}},
    write(name,value){fm.writeString(fm.joinPath(root,name),JSON.stringify(value));},
    fileText(path){return fm.readString(path.startsWith("file://")?decodeURIComponent(path.slice(7)):path);}};
}
export async function run() {
  const store=storage();let prefs=preferences(store.read("preferences.json"));let document=store.read("state.json");
  if(!validateDocument(document))document=null;
  const imports=[];
  for(const value of args.plainTexts||[])imports.push(value);
  for(const path of args.fileURLs||[]){try{imports.push(store.fileText(path));}catch{}}
  if(imports.length) {
    try {
      document=parseDocument(imports[0]);store.write("state.json",document);
      prefs={...prefs,species:"auto"};store.write("preferences.json",prefs);
      await notice("Показатели сохранены","Теперь выбери MOCHI в настройках виджета на главном экране. Для одного питомца используй параметр pet, для потребностей — needs.");
    } catch(error) {await notice("Данные не получены",error.message);}
  } else if(!config.runsInWidget) {
    const selected=await choice("MOCHI на главном экране",["Посмотреть виджет","Выбрать питомца","Вид виджета","Импортировать из буфера","Как добавить на экран","Открыть игру"]);
    if(selected===1) {
      const keys=Object.keys(petNames);const index=await choice("Кто будет в виджете?",["Питомец из игры",...keys.map(k=>petLabels[k])]);
      if(index>=0){prefs={...prefs,species:index===0?"auto":keys[index-1]};store.write("preferences.json",prefs);}
    } else if(selected===2) {
      const index=await choice("Что показывать?",["Только питомец","Еда, сон и игры","Питомец и потребности (средний)"]);
      if(index>=0){prefs={...prefs,mode:["pet","needs","both"][index]};store.write("preferences.json",prefs);}
    } else if(selected===3) {
      try {document=parseDocument(Pasteboard.pasteString());store.write("state.json",document);prefs={...prefs,species:"auto"};store.write("preferences.json",prefs);await notice("Показатели сохранены","iPhone обновит виджет при следующей перерисовке. Можно посмотреть результат прямо сейчас.");}
      catch(error){await notice("Данные не получены",error.message);}
    } else if(selected===4) {
      await notice("Настоящий виджет iPhone","Удерживай пустое место на главном экране → добавь виджет Scriptable → удерживай его → «Изменить виджет» → выбери скрипт MOCHI. Параметр pet покажет питомца, needs — потребности, both — оба варианта. Потребности передаются из настроек игры вручную.");
    } else if(selected===5) {await Safari.open(GAME_URL);Script.complete();return;}
    else if(selected<0){Script.complete();return;}
  }
  const family=config.widgetFamily||((prefs.mode==="both")?"medium":"small");
  const widget=buildWidget(document,prefs,args.widgetParameter||"",family);
  if(config.runsInWidget)Script.setWidget(widget);
  else if(family==="small")await widget.presentSmall();
  else await widget.presentMedium();
  Script.complete();
}
