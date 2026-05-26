export function toMinutes(hhmm: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return NaN;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  return h * 60 + mm;
}

export function minutesToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function uid(): string {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function prettyTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function sortByStart<T extends { start: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

// Overnight logic: timeline starts at WAKE.
export function relMinutes(clockHHMM: string, wakeHHMM: string): number {
  const c = toMinutes(clockHHMM);
  const w = toMinutes(wakeHHMM);
  if (!Number.isFinite(c) || !Number.isFinite(w)) return NaN;
  return c < w ? c + 1440 : c;
}

export function sleepRelMinutes(wakeHHMM: string, sleepHHMM: string): number {
  const w = toMinutes(wakeHHMM);
  const s = toMinutes(sleepHHMM);
  if (!Number.isFinite(w) || !Number.isFinite(s)) return NaN;
  return s <= w ? s + 1440 : s;
}

export function blockRelRange(startHHMM: string, endHHMM: string, wakeHHMM: string): { rs: number; re: number } {
  const rs = relMinutes(startHHMM, wakeHHMM);
  let re = relMinutes(endHHMM, wakeHHMM);
  if (!Number.isFinite(rs) || !Number.isFinite(re)) return { rs: NaN, re: NaN };
  if (re <= rs) re += 1440;
  return { rs, re };
}

export function overlaps(aS: number, aE: number, bS: number, bE: number): boolean {
  return aS < bE && bS < aE;
}

export function to12h(hhmm24: string): { time: string; ampm: "AM" | "PM" } {
  const m = toMinutes(hhmm24);
  if (!Number.isFinite(m)) return { time: "12:00", ampm: "AM" };
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return { time: `${h12}:${String(mm).padStart(2, "0")}`, ampm };
}

export function from12h(time: string, ampm: "AM" | "PM"): string | null {
  const m = /^([0-9]{1,2}):([0-5]\d)$/.exec(time.trim());
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 1 || hh > 12) return null;
  if (ampm === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function fromSmartTimeInput(raw: string, currentAmPm: "AM" | "PM"): string | null {
  const s = raw.trim();
  if (!s) return null;

  const colon24 = /^([0-9]{1,2}):([0-5]\d)$/.exec(s);
  if (colon24) {
    const h = Number(colon24[1]);
    const m = Number(colon24[2]);
    if (h >= 0 && h <= 23) return minutesToHHMM(h * 60 + m);
  }

  if (/^[0-9]{1,4}$/.test(s)) {
    const n = s.replace(/^0+/, "") || "0";

    if (n.length <= 2) {
      const h = Number(n);
      if (h === 0) return "00:00";
      if (h >= 13 && h <= 23) return minutesToHHMM(h * 60);
      if (h === 12) return "12:00";
    }

    if (n.length === 3 || n.length === 4) {
      const hourDigits = n.length === 3 ? 1 : 2;
      const h = Number(n.slice(0, hourDigits));
      const m = Number(n.slice(hourDigits));
      if (m >= 0 && m <= 59) {
        if (h === 0) return minutesToHHMM(m);
        if (h >= 13 && h <= 23) return minutesToHHMM(h * 60 + m);
        if (h === 12) return minutesToHHMM(12 * 60 + m);
      }
    }
  }

  const maybeText = smart12hText(s);
  return maybeText ? from12h(maybeText, currentAmPm) : null;
}

export function toggleAmPm(hhmm24: string): string {
  const m = toMinutes(hhmm24);
  if (!Number.isFinite(m)) return hhmm24;
  return minutesToHHMM((m + 12 * 60) % 1440);
}

// Smart parsing: "5" => "5:00", "515" => "5:15", "530" => "5:30"
export function smart12hText(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const colon = /^([0-9]{1,2}):([0-5]\d)$/.exec(s);
  if (colon) {
    const h = Number(colon[1]);
    const m = Number(colon[2]);
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) return `${h}:${String(m).padStart(2, "0")}`;
    return null;
  }

  if (!/^[0-9]{1,4}$/.test(s)) return null;
  const n = s.replace(/^0+/, "") || "0";

  if (n.length === 1 || n.length === 2) {
    const h = Number(n);
    if (h >= 1 && h <= 12) return `${h}:00`;
    return null;
  }
  if (n.length === 3) {
    const h = Number(n.slice(0, 1));
    const m = Number(n.slice(1));
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) return `${h}:${String(m).padStart(2, "0")}`;
    return null;
  }
  if (n.length === 4) {
    const h = Number(n.slice(0, 2));
    const m = Number(n.slice(2));
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) return `${h}:${String(m).padStart(2, "0")}`;
    return null;
  }
  return null;
}

export function dayKeyForToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
