import type {
  AppState,
  CityRow,
  DreamHousePlan,
  Finance,
  Goals,
  HealthFitness,
  LogRow,
  PersonRow,
  PlaceRow,
  FoodRow,
  StepId,
  Theme,
  TodayData,
  TopItem,
} from "./types";
import { dayKeyForToday, uid, minutesToHHMM, relMinutes, sleepRelMinutes } from "./utils/time";

const KEY = "project_dream_v7";

function defaultFinance(): Finance {
  return { fireNumber: 2000000, currentNetWorth: 0, monthlyInvest: 0, annualReturnPct: 7, notes: "" };
}

function defaultGoals(): Goals {
  return {
    short1y: [{ id: uid(), text: "" }],
    mid3y: [{ id: uid(), text: "" }],
    long5y: [{ id: uid(), text: "" }],
  };
}

export function defaultCityCriteriaNames(): string[] {
  return [
    "Child friendly","Weather","Family","Friends","Safety","Job opportunities",
    "Convenience","Food","Education","Cost","Language & culture","Comfort"
  ];
}

function normalizeCityCriteria(criteria: any): string[] {
  const raw = Array.isArray(criteria) && criteria.length ? criteria : defaultCityCriteriaNames();
  const out: string[] = [];
  raw.forEach((x) => {
    const name = String(x || "").trim();
    const normalized = name === "Startup opportunities" ? "Job opportunities" : name;
    if (normalized && !out.includes(normalized) && out.length < 15) out.push(normalized);
  });
  return out.length ? out : defaultCityCriteriaNames();
}

function defaultCityCriteria(criteria = defaultCityCriteriaNames()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of criteria) out[c] = 3;
  return out;
}

function defaultEnd(start: string, wake: string, sleep: string): string {
  const startRel = relMinutes(start, wake);
  const sleepRel = sleepRelMinutes(wake, sleep);
  let endRel = startRel + 60;
  if (Number.isFinite(sleepRel)) endRel = Math.min(endRel, sleepRel);
  return minutesToHHMM(endRel);
}

export function defaultToday(wakeTime = "08:00", sleepTime = "23:00"): TodayData {
  return {
    wakeTime,
    sleepTime,
    blocks: [{ id: uid(), start: wakeTime, end: defaultEnd(wakeTime, wakeTime, sleepTime), activity: "", withWho: "" }],
  };
}

export function makeDefaultCity(criteria = defaultCityCriteriaNames()): CityRow {
  return { id: uid(), city: "", notes: "", scores: defaultCityCriteria(criteria) };
}

function normalizeCity(row: any, criteria: string[]): CityRow {
  const scores = row?.scores || {};
  const nextScores: Record<string, number> = {};
  criteria.forEach((criterion) => {
    const legacyValue = criterion === "Job opportunities" ? scores["Startup opportunities"] : undefined;
    nextScores[criterion] = Number(scores[criterion] ?? legacyValue ?? 3);
  });
  return {
    id: row?.id ?? uid(),
    city: row?.city ?? "",
    notes: row?.notes ?? "",
    scores: nextScores,
  };
}

function defaultCompleted(): Record<StepId, boolean> {
  return {
    schedule: false,
    people: false,
    top10: false,
    goals: false,
    cities: false,
    places: false,
    food: false,
    dreamhouse: false,
    finance: false,
    health: false,
  };
}

function defaultDreamHouse(): DreamHousePlan {
  return {
    projectName: "",
    location: "",
    environment: "",
    propertyType: "",
    budgetTWD: 0,
    landPing: 0,
    indoorPing: 0,
    floors: 0,
    bedrooms: 0,
    bathrooms: 0,
    halfBaths: 0,
    hasGym: false,
    hasTheater: false,
    hasPool: false,
    hasHotTub: false,
    hasBasketballCourt: false,
    mustHaves: [""],
    niceToHaves: [""],
    notes: "",
  };
}


function defaultLog(): LogRow {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return { id: uid(), date: `${yyyy}-${mm}-${dd}`, note: "" };
}

function defaultHealth(): HealthFitness {
  return {
    height: "",
    weight: "",
    bodyFatPct: 0,
    goalWeight: "",
    goalBodyFatPct: 0,
    dietPlan: "",
    workoutPlan: "",
    dietLogs: [defaultLog()],
    workoutLogs: [defaultLog()],
  };
}

function ensureAtLeastOne<T>(arr: T[], factory: () => T): T[] {
  return Array.isArray(arr) && arr.length > 0 ? arr : [factory()];
}

function ensureCount<T>(arr: T[], count: number, factory: () => T): T[] {
  const items = Array.isArray(arr) ? arr.slice(0, count) : [];
  while (items.length < count) items.push(factory());
  return items;
}

function normalizeTop10(items: any[], factory: () => TopItem): TopItem[] {
  const raw = Array.isArray(items) ? items.slice(0, 10) : [];
  const normalized = raw.map((x) => ({
    id: x?.id ?? uid(),
    text: x?.text ?? "",
    done: Boolean(x?.done),
    targetMonth: x?.targetMonth ?? "",
  }));

  while (
    normalized.length > 1 &&
    !String(normalized[normalized.length - 1].text || "").trim() &&
    !normalized[normalized.length - 1].done
  ) {
    normalized.pop();
  }

  return normalized.length ? normalized : [factory()];
}

function normalizeHealth(health: any): HealthFitness {
  const next: HealthFitness = {
    ...defaultHealth(),
    ...(health || {}),
    height: health?.height ?? (health?.heightCm ? `${health.heightCm}cm` : ""),
    weight: health?.weight ?? (health?.weightKg ? `${health.weightKg}kg` : ""),
    goalWeight: health?.goalWeight ?? (health?.goalWeightKg ? `${health.goalWeightKg}kg` : ""),
    dietPlan: health?.dietPlan ?? health?.dietNotes ?? "",
    workoutPlan: health?.workoutPlan ?? health?.workoutNotes ?? "",
  };

  if (next.height === "178cm") next.height = "";
  if (next.weight === "74kg") next.weight = "";
  if (next.bodyFatPct === 12) next.bodyFatPct = 0;
  if (next.goalWeight === "70kg") next.goalWeight = "";
  if (next.goalBodyFatPct === 10) next.goalBodyFatPct = 0;

  return next;
}

function normalizeState(s: any): AppState {
  const today = dayKeyForToday();
  const schedules = s.schedules || {};
  if (!schedules[today]) schedules[today] = defaultToday();

  const peopleFactory = (): PersonRow => ({ id: uid(), name: "", relationship: "", positive: true, notes: "" });
  const placeFactory = (): PlaceRow => ({ id: uid(), place: "", times: 1, frequency: "weekly", vibe: 3, wantMore: false, notes: "" });
  const foodFactory = (): FoodRow => ({ id: uid(), restaurant: "", city: "", mustOrder: "" });
  const topFactory = (): TopItem => ({ id: uid(), text: "", done: false, targetMonth: "" });
  const cityCriteria = normalizeCityCriteria(s.cityCriteria);

  return {    theme: (s.theme === "dark" || s.theme === "light") ? s.theme : "light",
    name: s.name ?? "",
    email: s.email ?? "",
    schedules,

    people: ensureAtLeastOne(s.people || [], peopleFactory),
    top10: normalizeTop10(s.top10 || [], topFactory),
    goals: s.goals ? {
      short1y: ensureAtLeastOne(s.goals.short1y || [], topFactory).map((x: TopItem) => ({ ...x, targetMonth: x.targetMonth ?? "" })),
      mid3y: ensureAtLeastOne(s.goals.mid3y || [], topFactory).map((x: TopItem) => ({ ...x, targetMonth: x.targetMonth ?? "" })),
      long5y: ensureAtLeastOne(s.goals.long5y || [], topFactory).map((x: TopItem) => ({ ...x, targetMonth: x.targetMonth ?? "" })),
    } : defaultGoals(),
    cityCriteria,
    cities: ensureAtLeastOne(s.cities || [], () => makeDefaultCity(cityCriteria)).map((c: any) => normalizeCity(c, cityCriteria)),
    places: ensureAtLeastOne(s.places || [], placeFactory).map((p: PlaceRow) => ({ ...p, times: Number(p.times ?? 1) })),
    foods: ensureAtLeastOne((s.foods || []).slice(0, 5), foodFactory),

    dreamHouse: s.dreamHouse ?? defaultDreamHouse(),
    finance: s.finance ?? defaultFinance(),
    health: normalizeHealth(s.health),
    updatedAt: s.updatedAt ?? s.completedAt ?? {},
    completed: s.completed ?? defaultCompleted(),
  };
}

export function blankState(): AppState {
  const today = dayKeyForToday();
  return {    theme: "light",
    name: "",
    email: "",
    schedules: { [today]: defaultToday() },
    people: [{ id: uid(), name: "", relationship: "", positive: true, notes: "" }],
    top10: [{ id: uid(), text: "", done: false }],
    goals: {
      short1y: [{ id: uid(), text: "", targetMonth: "" }],
      mid3y: [{ id: uid(), text: "", targetMonth: "" }],
      long5y: [{ id: uid(), text: "", targetMonth: "" }],
    },
    cityCriteria: defaultCityCriteriaNames(),
    cities: [makeDefaultCity()],
    places: [{ id: uid(), place: "", times: 1, frequency: "weekly", vibe: 3, wantMore: false, notes: "" }],
    foods: [{ id: uid(), restaurant: "", city: "", mustOrder: "" }],
    dreamHouse: {
      projectName: "",
      location: "",
      environment: "ocean",
      propertyType: "land_build",
      budgetTWD: 0,
      landPing: 0,
      indoorPing: 0,
      floors: 0,
      bedrooms: 0,
      bathrooms: 0,
      halfBaths: 0,
      hasGym: false,
      hasTheater: false,
      hasPool: false,
      hasHotTub: false,
      hasBasketballCourt: false,
      mustHaves: [""],
      niceToHaves: [""],
      notes: "",
    },
    finance: { fireNumber: 0, currentNetWorth: 0, monthlyInvest: 0, annualReturnPct: 7, notes: "" },
    health: defaultHealth(),
    updatedAt: {},
    completed: {
      schedule: false,
      people: false,
      top10: false,
      goals: false,
      cities: false,
      places: false,
      food: false,
      dreamhouse: false,
      finance: false,
      health: false,
    },
  };
}

export function loadState(): AppState {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return normalizeState(parsed);
    } catch {}
  }

  const today = dayKeyForToday();
  return normalizeState({
    theme: "light",
    name: "",
    email: "",
    schedules: { [today]: defaultToday() },

    people: [{ id: uid(), name: "", relationship: "", positive: true, notes: "" }],
    top10: [{ id: uid(), text: "", done: false }],
    goals: defaultGoals(),
    cityCriteria: defaultCityCriteriaNames(),
    cities: [makeDefaultCity()],
    places: [{ id: uid(), place: "", times: 1, frequency: "weekly", vibe: 3, wantMore: false, notes: "" }],
    foods: [{ id: uid(), restaurant: "", city: "", mustOrder: "" }],

    dreamHouse: defaultDreamHouse(),
    finance: defaultFinance(),
    health: defaultHealth(),
    updatedAt: {},
    completed: defaultCompleted(),
  });
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

export function ensureTodaySchedule(state: AppState): AppState {
  return normalizeState(state);
}
