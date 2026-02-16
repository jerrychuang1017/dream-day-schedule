export type TimeBlock = {
  id: string;
  start: string; // 24h "HH:MM"
  end: string;   // 24h "HH:MM"
  activity: string;
  withWho: string;
};

export type TodayData = {
  wakeTime: string;
  sleepTime: string;
  blocks: TimeBlock[];
  lastSavedAt?: string;
};
