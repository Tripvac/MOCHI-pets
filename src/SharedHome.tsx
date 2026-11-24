import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Heart,
  House,
  Link,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { GameStore } from "./useGameStore";
export default function SharedHome({
  store,
  onDone,
}: {
  store: GameStore;
  onDone: () => void;
}) {
  const { network, probe, createHouse, joinHouse, disconnect, setActor } =
    store;
  const [actor, setActorInput] = useState(network.actor),
    [code, setCode] = useState(""),
    [confirm, setConfirm] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    void probe();
  }, [probe]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(network.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="shared-home-content">
      <div className="shared-illustration">
        <span>
          <House size={38} strokeWidth={1.3} />
          <Heart size={17} />
        </span>
        <i />
        <span>
          <Users size={35} strokeWidth={1.3} />
        </span>
      </div>
      <h3>Один дом. Двое рядом.</h3>
      <p className="sheet-description">
        Кормите, играйте и собирайте маленькую историю вместе — каждый со своего
        телефона.
      </p>
      <label className="input-label" htmlFor="house-actor">
        Твоё имя в истории
      </label>
      <input
        id="house-actor"
        className="name-input"
        maxLength={24}
        value={actor}
        onChange={(e) => setActorInput(e.target.value)}
        onBlur={() => setActor(actor)}
      />
      {network.code ? (
        <>
          <div
            className={`connection-status ${network.status === "connected" ? "connected" : ""}`}
          >
            {network.status === "connected" ? (
              <Wifi size={16} />
            ) : (
              <WifiOff size={16} />
            )}
            <span>
              {network.status === "connected"
                ? "Ваш дом на связи"
                : "Сейчас нет связи с домом"}
            </span>
          </div>
          <label className="input-label">Код для второго человека</label>
          <div className="house-code">
            <code>{network.code}</code>
            <button onClick={copy} aria-label="Скопировать код дома">
              {copied ? <Check size={19} /> : <Copy size={19} />}
            </button>
          </div>
          <p className="settings-hint">
            Друг откроет тот же адрес игры и введёт этот код. Он даёт доступ к
            вашему общему дому.
          </p>
          <button className="primary" onClick={onDone}>
            <House size={18} />
            Вернуться домой
          </button>
          <button className="text-button" onClick={disconnect}>
            Продолжить на этом устройстве отдельно
          </button>
        </>
      ) : (
        <>
          {network.status === "offline" && (
            <div className="shared-offline">
              <WifiOff size={20} />
              <div>
                <strong>Общий дом ждёт своего сервера</strong>
                <p>
                  В скачанном проекте запусти START_SHARED_WINDOWS.bat. Затем
                  открой адрес компьютера на обоих телефонах в одной Wi-Fi сети.
                </p>
              </div>
            </div>
          )}
          <div className="join-house">
            <label className="input-label" htmlFor="shared-code">
              У тебя уже есть приглашение?
            </label>
            <input
              id="shared-code"
              className="name-input"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Введи код общего дома"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={24}
            />
            <button
              className="primary"
              disabled={
                network.busy ||
                code.trim().length !== 24 ||
                network.status === "offline"
              }
              onClick={async () => {
                setActor(actor);
                if (await joinHouse(code)) onDone();
              }}
            >
              <Link size={17} />
              Присоединиться к дому
            </button>
          </div>
          <div className="shared-divider">
            <span />
            или
            <span />
          </div>
          {confirm ? (
            <div className="reset-confirm">
              <p>
                Начнётся новая общая история с 1000 монет. Текущее локальное
                сохранение будет заменено новой общей историей.
              </p>
              <button
                className="primary"
                disabled={network.busy}
                onClick={async () => {
                  setActor(actor);
                  if (await createHouse()) onDone();
                }}
              >
                Создать новый общий дом
              </button>
              <button className="text-button" onClick={() => setConfirm(false)}>
                Вернуться к нашему питомцу
              </button>
            </div>
          ) : (
            <button
              className="shared-create"
              disabled={
                network.busy || !["ready", "connected"].includes(network.status)
              }
              onClick={() => setConfirm(true)}
            >
              <Users size={18} />
              Начать новую историю вдвоём
            </button>
          )}
        </>
      )}
      <p className="settings-version">
        Сохраняйте код только для вашего маленького круга.
      </p>
    </div>
  );
}
