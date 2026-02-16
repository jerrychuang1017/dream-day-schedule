import type { TodayData } from "./types";

const KEY_ALL = "dreamday_all_v4";
const KEY_NAME = "dreamday_name_v4";
const KEY_DAY = "dreamday_todaykey_v4";

function dayKeyForToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadAll(): Record<string, TodayData> {
  const raw = localStorage.getItem(KEY_ALL);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, TodayData>) : {};
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, TodayData>) {
  localStorage.setItem(KEY_ALL, JSON.stringify(all));
}

export function getName(): string {
  return localStorage.getItem(KEY_NAME) || "";
}

export function setName(name: string) {
  localStorage.setItem(KEY_NAME, name.trim());
}

export function clearName() {
  localStorage.removeItem(KEY_NAME);
}

export function loadToday(): TodayData {
  const key = dayKeyForToday();
  localStorage.setItem(KEY_DAY, key);

  const all = loadAll();
  const data = all[key];
  if (!data) return { wakeTime: "08:00", sleepTime: "23:00", blocks: [] };

  return {
    wakeTime: data.wakeTime || "08:00",
    sleepTime: data.sleepTime || "23:00",
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    lastSavedAt: data.lastSavedAt,
  };
}

export function saveToday(data: TodayData) {
  const key = localStorage.getItem(KEY_DAY) || dayKeyForToday();
  const all = loadAll();
  all[key] = data;
  saveAll(all);
}

export function clearToday() {
  const key = localStorage.getItem(KEY_DAY) || dayKeyForToday();
  const all = loadAll();
  delete all[key];
  saveAll(all);
}
