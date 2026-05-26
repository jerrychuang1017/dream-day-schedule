import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, LogRow } from "../types";
import { uid } from "../utils/time";

type Props = {
  state: AppState;
  setState: (s: AppState) => void;
};

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function newLog(): LogRow {
  return { id: uid(), date: todayStr(), note: "" };
}

export default function HealthFitness({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "health_fitness",
      theme: state.theme,
    });
  }

  const h = state.health;

  function setHealth(patch: Partial<typeof h>) {
    setState({ ...state, health: { ...h, ...patch } });
  }

  function updateDiet(id: string, patch: Partial<LogRow>) {
    setHealth({ dietLogs: h.dietLogs.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  }
  function updateWorkout(id: string, patch: Partial<LogRow>) {
    setHealth({ workoutLogs: h.workoutLogs.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  }
  function addDietLog(focusNewLog = false) {
    const log = newLog();
    setHealth({ dietLogs: [...h.dietLogs, log] });
    if (focusNewLog) setTimeout(() => document.querySelector<HTMLInputElement>(`[data-diet-log="${log.id}"]`)?.focus(), 0);
  }
  function addWorkoutLog(focusNewLog = false) {
    const log = newLog();
    setHealth({ workoutLogs: [...h.workoutLogs, log] });
    if (focusNewLog) setTimeout(() => document.querySelector<HTMLInputElement>(`[data-workout-log="${log.id}"]`)?.focus(), 0);
  }
  function addOnEnter(e: React.KeyboardEvent<HTMLInputElement>, add: () => void) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    add();
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s Health & fitness` : 'Health & fitness'}</div>
            <div className="sub">Body metrics + simple diet & exercise tracking.</div>
            {state.updatedAt?.health ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.health)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div>
          <div>
            <div className="label">Height</div>
            <input className="input" value={h.height} onChange={(e) => setHealth({ height: e.target.value })} placeholder="178cm or 5'10" />
          </div>
        </div>

        <div className="hr" />

        <div className="label">Current</div>
        <div className="grid2">
          <div>
            <div className="label">Weight</div>
            <input className="input" value={h.weight} onChange={(e) => setHealth({ weight: e.target.value })} placeholder="74kg or 165lb" />
          </div>
          <div>
            <div className="label">Body fat %</div>
            <input className="input" type="number" value={h.bodyFatPct || ""} onChange={(e) => setHealth({ bodyFatPct: Number(e.target.value || 0) })} />
          </div>
        </div>

        <div className="hr" />

        <div className="label">Goal</div>
        <div className="grid2">
          <div>
            <div className="label">Goal weight</div>
            <input className="input" value={h.goalWeight} onChange={(e) => setHealth({ goalWeight: e.target.value })} placeholder="70kg or 155lb" />
          </div>
          <div>
            <div className="label">Goal body fat %</div>
            <input className="input" type="number" value={h.goalBodyFatPct || ""} onChange={(e) => setHealth({ goalBodyFatPct: Number(e.target.value || 0) })} />
          </div>
        </div>

        <div className="hr" />

        <div className="grid2">
          <div>
            <div className="label">Diet plans</div>
            <textarea className="textarea" value={h.dietPlan} onChange={(e) => setHealth({ dietPlan: e.target.value })} placeholder="Rules, calories, macros, what works…" />
            <div className="hr" />
            <div className="label">Diet log</div>
            {h.dietLogs.map((x) => (
              <div key={x.id} className="healthLogRow">
                <input className="input healthDateInput" value={x.date} onChange={(e) => updateDiet(x.id, { date: e.target.value })} />
                <input className="input" data-diet-log={x.id} value={x.note} onKeyDown={(e) => addOnEnter(e, () => addDietLog(true))} onChange={(e) => updateDiet(x.id, { note: e.target.value })} placeholder="What did you eat?" />
                <button className="smallBtn danger" onClick={() => setHealth({ dietLogs: h.dietLogs.filter((d) => d.id !== x.id) })}>Del</button>
              </div>
            ))}
            <button className="button" onClick={() => addDietLog(true)}>+ Add</button>
          </div>
          <div>
            <div className="label">Workout plans</div>
            <textarea className="textarea" value={h.workoutPlan} onChange={(e) => setHealth({ workoutPlan: e.target.value })} placeholder="Program, frequency, focus, injuries…" />
            <div className="hr" />
            <div className="label">Workout log</div>
            {h.workoutLogs.map((x) => (
              <div key={x.id} className="healthLogRow">
                <input className="input healthDateInput" value={x.date} onChange={(e) => updateWorkout(x.id, { date: e.target.value })} />
                <input className="input" data-workout-log={x.id} value={x.note} onKeyDown={(e) => addOnEnter(e, () => addWorkoutLog(true))} onChange={(e) => updateWorkout(x.id, { note: e.target.value })} placeholder="Workout / cardio / lift / steps…" />
                <button className="smallBtn danger" onClick={() => setHealth({ workoutLogs: h.workoutLogs.filter((d) => d.id !== x.id) })}>Del</button>
              </div>
            ))}
            <button className="button" onClick={() => addWorkoutLog(true)}>+ Add</button>
          </div>
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
