import { useState } from "react";
import { Download, Copy } from "lucide-react";
import { assetUrl } from "./assets";
import { exportWidgetState } from "./widgetExport";
import type { State } from "./model";

export default function PhoneWidgetSetup({state}: {state: State}) {
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const transfer=async()=>{
    if(busy)return;
    setBusy(true);
    try {
      const content=JSON.stringify(exportWidgetState(state));
      try {
        await navigator.clipboard.writeText(content);
        setMessage("Показатели скопированы. Открой Scriptable → MOCHI → «Импортировать из буфера».");
      } catch {
        const file=new File([content],"MOCHI-widget.json",{type:"application/json"});
        if(navigator.canShare?.({files:[file]})) {
          await navigator.share({files:[file],title:"Потребности питомца MOCHI"});
          setMessage("Передай файл скрипту MOCHI в Scriptable.");
        } else {
          const url=URL.createObjectURL(file),link=document.createElement("a");
          link.href=url;link.download=file.name;link.click();
          setTimeout(()=>URL.revokeObjectURL(url),10000);
          setMessage("Файл сохранён. Поделись им со Scriptable и выбери MOCHI.");
        }
      }
    } catch(error) {
      setMessage(error instanceof Error && error.name==="AbortError"?"Передача отменена.":"Не удалось передать показатели. Повтори касание.");
    } finally {setBusy(false);}
  };
  return <section className="settings-group phone-widget-setup">
    <h3>Виджет на iPhone</h3>
    <p className="settings-hint">Питомец или его потребности на главном экране. Для установки потребуется приложение Scriptable.</p>
    <a className="sound-test widget-download" href={assetUrl("/widgets/MOCHI.scriptable")} download="MOCHI.scriptable"><Download size={17}/>Скачать виджет</a>
    <button className="sound-test" onClick={()=>void transfer()} disabled={busy||!state.adopted}><Copy size={17}/>{busy?"Подготавливаем…":"Передать потребности"}</button>
    <p className="settings-hint">Открой файл через Scriptable. Затем добавь его виджет на экран iPhone и выбери скрипт MOCHI. Питомец работает сразу; потребности передаются из игры вручную.</p>
    {message&&<p className="settings-hint" role="status">{message}</p>}
  </section>;
}
