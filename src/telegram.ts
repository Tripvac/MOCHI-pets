interface TelegramApp {
  ready(): void;
  expand(): void;
  addToHomeScreen?(): void;
  isVersionAtLeast(v: string): boolean;
  setHeaderColor(c: string): void;
  setBackgroundColor(c: string): void;
  setBottomBarColor?(c: string): void;
  disableVerticalSwipes?(): void;
  contentSafeAreaInset?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  onEvent?(event: string, cb: () => void): void;
  offEvent?(event: string, cb: () => void): void;
  initData: string;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(f: () => void): void;
    offClick(f: () => void): void;
  };
  HapticFeedback?: {
    impactOccurred(style: string): void;
    notificationOccurred(style: string): void;
  };
}
declare global {
  interface Window {
    Telegram?: { WebApp: TelegramApp };
  }
}
export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg || !tg.initData) return () => {};
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#f5f1e9");
  tg.setBackgroundColor("#f5f1e9");
  if (tg.isVersionAtLeast("7.10")) tg.setBottomBarColor?.("#f5f1e9");
  if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes?.();
  const safe = () => {
    const area = tg.contentSafeAreaInset || tg.safeAreaInset;
    document.documentElement.style.setProperty(
      "--tg-safe-top",
      `${area?.top || 0}px`,
    );
    document.documentElement.style.setProperty(
      "--tg-safe-bottom",
      `${area?.bottom || 0}px`,
    );
  };
  safe();
  tg.onEvent?.("contentSafeAreaChanged", safe);
  tg.onEvent?.("safeAreaChanged", safe);
  return () => {
    tg.offEvent?.("contentSafeAreaChanged", safe);
    tg.offEvent?.("safeAreaChanged", safe);
  };
}
export function haptic(success = false) {
  try {
    const t = window.Telegram?.WebApp;
    if (t?.initData && t.isVersionAtLeast("6.1"))
      success
        ? t.HapticFeedback?.notificationOccurred("success")
        : t.HapticFeedback?.impactOccurred("light");
  } catch {
    /* Browser and old Telegram clients remain usable. */
  }
}
export { playSound as sound } from "./audio";
