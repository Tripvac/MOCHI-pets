import { useCallback, useEffect, useRef, useState } from "react";
import { act, normalize } from "../shared/game.mjs";
import { loadState, SAVE_KEY, type Action, type State } from "./model";
interface SharedConfig {
  code: string;
  actor: string;
}
const CONFIG_KEY = "mochi.shared.v3";
export function useGameStore() {
  const [state, setState] = useState<State>(loadState),
    [config, setConfigState] = useState<SharedConfig>(() => {
      try {
        return {
          code: "",
          actor: "Ты",
          ...JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"),
        };
      } catch {
        return { code: "", actor: "Ты" };
      }
    }),
    [status, setStatus] = useState<
      "local" | "checking" | "ready" | "connected" | "offline"
    >("local"),
    [busy, setBusy] = useState(false);
  const latest = useRef(state),
    connection = useRef(config),
    inFlight = useRef(false),
    mounted = useRef(true),
    warned = useRef(false);
  latest.current = state;
  connection.current = config;
  const commit = useCallback((next: State) => {
    latest.current = next;
    if (mounted.current) setState(next);
    try {
      const { error, ...save } = next;
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      if (!warned.current) {
        warned.current = true;
        const error = {
          id: Date.now(),
          message:
            "Не удалось сохранить прогресс. Разреши хранение данных в браузере.",
        };
        latest.current = { ...next, error };
        if (mounted.current) setState(latest.current);
      }
    }
  }, []);
  const report = useCallback((e: unknown) => {
    const next = {
      ...latest.current,
      error: {
        id: Date.now() + Math.random(),
        message:
          e instanceof Error ? e.message : "Не удалось связаться с домом.",
      },
    };
    latest.current = next;
    if (mounted.current) setState(next);
  }, []);
  const setConfig = useCallback((next: SharedConfig) => {
    connection.current = next;
    setConfigState(next);
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch {}
  }, []);
  const request = useCallback(async (path: string, body?: unknown) => {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 6000);
    try {
      const r = await fetch(path, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json", "X-Telegram-Init-Data": window.Telegram?.WebApp?.initData || "" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const type = r.headers.get("content-type") || "";
      if (!type.includes("application/json"))
        throw Error(
          "Общий дом пока недоступен. Проверь подключение.",
        );
      const data = await r.json();
      if (!r.ok) {
        const error = new Error(
          data.error || "Не удалось открыть общий дом.",
        ) as Error & { state?: State; status?: number };
        error.state = data.state;
        error.status = r.status;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }, []);
  const probe = useCallback(async () => {
    if (connection.current.code) return true;
    setStatus("checking");
    try {
      const data = await request("/api/health");
      if (!data.sharing) throw Error();
      if (mounted.current) setStatus("ready");
      return true;
    } catch {
      if (mounted.current) setStatus("offline");
      return false;
    }
  }, [request]);
  const refresh = useCallback(async () => {
    if (!connection.current.code || inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await request("/api/state", {
        code: connection.current.code,
      });
      const next = normalize(data.state) as State;
      next.settings = latest.current.settings;
      next.introSeen = latest.current.introSeen;
      commit(next);
      if (mounted.current) setStatus("connected");
    } catch {
      if (mounted.current) setStatus("offline");
    } finally {
      inFlight.current = false;
    }
  }, [request, commit]);
  const dispatch = useCallback(
    async (a: Action): Promise<boolean> => {
      const local =
        ["settings", "intro", "reset", "replace"].includes(a.type) ||
        !connection.current.code;
      if (local) {
        try {
          if (a.type === "reset") {
            setConfig({ ...connection.current, code: "" });
            setStatus("local");
          }
          const next = act(latest.current, a);
          commit(next);
          return true;
        } catch (e) {
          report(e);
          return false;
        }
      }
      if (a.type === "tick") {
        void refresh();
        return true;
      }
      if (inFlight.current) {
        report(Error("Минутку — сохраняем нашу историю."));
        return false;
      }
      inFlight.current = true;
      setBusy(true);
      try {
        const requestId =
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Date.now() + "-" + Math.random();
        const body = {
          code: connection.current.code,
          action: { ...a, actor: connection.current.actor },
          expectedVersion: latest.current.rev,
          requestId,
        };
        let data;
        try {
          data = await request("/api/action", body);
        } catch (e) {
          const error = e as Error & { state?: State; status?: number };
          if (error.status !== 409 || !error.state) throw e;
          body.expectedVersion = error.state.rev;
          data = await request("/api/action", body);
        }
        const next = normalize(data.state) as State;
        next.settings = latest.current.settings;
        next.introSeen = true;
        commit(next);
        setStatus("connected");
        return true;
      } catch (e) {
        report(e);
        setStatus("offline");
        return false;
      } finally {
        inFlight.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [commit, refresh, report, request, setConfig],
  );
  const createHouse = useCallback(async () => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      const data = await request("/api/create", {
        state: latest.current,
        actor: connection.current.actor,
      });
      const next = normalize(data.state) as State;
      next.settings = latest.current.settings;
      next.introSeen = true;
      setConfig({ ...connection.current, code: data.code });
      commit(next);
      setStatus("connected");
      return true;
    } catch (e) {
      report(e);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [request, commit, setConfig, report]);
  const joinHouse = useCallback(
    async (code: string) => {
      const normalizedCode = code.trim().toLowerCase();
      if (!/^[a-f0-9]{24}$/.test(normalizedCode)) {
        report(Error("Проверь код: нужно 24 символа."));
        return false;
      }
      if (inFlight.current) return false;
      inFlight.current = true;
      setBusy(true);
      try {
        const data = await request("/api/state", { code: normalizedCode });
        const next = normalize(data.state) as State;
        next.settings = latest.current.settings;
        next.introSeen = true;
        setConfig({ ...connection.current, code: normalizedCode });
        commit(next);
        setStatus("connected");
        return true;
      } catch (e) {
        report(e);
        return false;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [request, commit, setConfig, report],
  );
  const disconnect = useCallback(() => {
    setConfig({ ...connection.current, code: "" });
    setStatus("local");
    commit({ ...latest.current });
  }, [setConfig, commit]);
  const setActor = useCallback(
    (actor: string) =>
      setConfig({
        ...connection.current,
        actor: actor.trim().slice(0, 24) || "Ты",
      }),
    [setConfig],
  );
  useEffect(() => {
    mounted.current = true;
    commit(latest.current);
    return () => {
      mounted.current = false;
    };
  }, [commit]);
  useEffect(() => {
    if (!config.code) return;
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [config.code, refresh]);
  return {
    state,
    dispatch,
    network: { ...config, status, busy },
    probe,
    createHouse,
    joinHouse,
    disconnect,
    setActor,
  };
}
export type GameStore = ReturnType<typeof useGameStore>;
