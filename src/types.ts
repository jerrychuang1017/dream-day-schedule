export type Theme = "dark" | "light";

export type TimeBlock = {
  id: string;
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM" 24h
  activity: string;
  withWho: string;
};

export type TodayData = {
  wakeTime: string;
  sleepTime: string;
  blocks: TimeBlock[];
  lastSavedAt?: string;
};

export type PersonRow = {
  id: string;
  name: string;
  relationship: string;
  positive: boolean;
  notes: string;
};

export type TopItem = { id: string; text: string; done?: boolean; targetMonth?: string };

export type Goals = {
  short1y: TopItem[];
  mid3y: TopItem[];
  long5y: TopItem[];
};

export type CityRow = {
  id: string;
  city: string;
  notes: string;
  scores: Record<string, number>;
};

export type PlaceRow = {
  id: string;
  place: string;
  times: number;
  frequency: "daily" | "weekly" | "monthly" | "rare";
  vibe: number;
  wantMore: boolean;
  notes: string;
};

export type FoodRow = {
  id: string;
  restaurant: string;
  city: string;
  mustOrder: string;
};

export type Finance = {
  fireNumber: number;
  currentNetWorth: number;
  monthlyInvest: number;
  annualReturnPct: number;
  notes: string;
};

export type DreamHousePlan = {
  projectName: string;
  location: string;
  environment: string;
  propertyType: string;
  budgetTWD: number;
  landPing: number;
  indoorPing: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  halfBaths: number;
  hasGym: boolean;
  hasTheater: boolean;
  hasPool: boolean;
  hasHotTub: boolean;
  hasBasketballCourt: boolean;
  mustHaves: string[];
  niceToHaves: string[];
  notes: string;
};

export type LogRow = { id: string; date: string; note: string };

export type HealthFitness = {
  height: string;
  weight: string;
  bodyFatPct: number;
  goalWeight: string;
  goalBodyFatPct: number;
  dietPlan: string;
  workoutPlan: string;
  dietLogs: LogRow[];
  workoutLogs: LogRow[];
};

export type StepId =
  | "schedule"
  | "people"
  | "top10"
  | "goals"
  | "cities"
  | "places"
  | "food"
  | "dreamhouse"
  | "finance"
  | "health";

export type AppState = {
  theme: Theme;
  name: string;
  email?: string;

  schedules: Record<string, TodayData>;

  people: PersonRow[];
  top10: TopItem[];
  goals: Goals;
  cityCriteria: string[];
  cities: CityRow[];
  places: PlaceRow[];
  foods: FoodRow[];

  dreamHouse: DreamHousePlan;
  finance: Finance;
  health: HealthFitness;

  updatedAt?: Partial<Record<StepId, string>>;
  completed: Record<StepId, boolean>;
};
