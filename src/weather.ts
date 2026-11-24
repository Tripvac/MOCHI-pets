import type { State } from "./model";
type Weather = State["settings"]["weather"];
export interface Forecast {
  weather: Weather;
  temperature: number;
  weatherAt: number;
}
let cached: Forecast | undefined, pending: Promise<Forecast> | undefined;
export function almatyWeather(force = false): Promise<Forecast> {
  if (!force && cached && Date.now() - cached.weatherAt < 15 * 60 * 1000)
    return Promise.resolve(cached);
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current=weather_code,temperature_2m&timezone=Asia%2FAlmaty",
        { signal: controller.signal },
      );
      if (!response.ok) throw Error("Forecast unavailable");
      const { current } = await response.json(),
        code = Number(current?.weather_code),
        temperature = Number(current?.temperature_2m);
      if (!Number.isFinite(code) || !Number.isFinite(temperature))
        throw Error("Incomplete forecast");
      const weather: Weather = [71, 73, 75, 77, 85, 86].includes(code)
        ? "snow"
        : [
              51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
            ].includes(code)
          ? "rain"
          : code >= 2
            ? "cloud"
            : "clear";
      cached = {
        weather,
        temperature: Math.round(temperature),
        weatherAt: Date.now(),
      };
      return cached;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
