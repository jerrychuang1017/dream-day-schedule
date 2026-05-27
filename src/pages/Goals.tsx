import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, TopItem } from "../types";
import { uid } from "../utils/time";

type Props = { state: AppState; setState: (s: AppState) => void };
type GoalKey = "short1y" | "mid3y" | "long5y";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  if (!key) return "";
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function monthOptions(startOffsetMonths: number, endOffsetMonths: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = Math.max(0, endOffsetMonths - startOffsetMonths + 1);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + startOffsetMonths + i, 1);
    const value = monthKey(d);
    return { value, label: monthLabel(value) };
  });
}

function clampTargetMonth(value: string | undefined, startOffsetMonths: number, endOffsetMonths: number) {
  const options = monthOptions(startOffsetMonths, endOffsetMonths);
  if (!value) return "";
  if (options.some((opt) => opt.value === value)) return value;
  const first = options[0]?.value ?? "";
  const last = options[options.length - 1]?.value ?? "";
  if (first && value < first) return first;
  return last;
}

function List({
  title,
  startOffsetMonths,
  endOffsetMonths,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  startOffsetMonths: number;
  endOffsetMonths: number;
  items: TopItem[];
  onAdd: (focusNewGoal?: boolean) => void;
  onUpdate: (id: string, patch: Partial<TopItem>) => void;
  onRemove: (id: string) => void;
}) {
  const options = monthOptions(startOffsetMonths, endOffsetMonths);
  const sorted = [...items].sort((a, b) => {
    const at = clampTargetMonth(a.targetMonth, startOffsetMonths, endOffsetMonths);
    const bt = clampTargetMonth(b.targetMonth, startOffsetMonths, endOffsetMonths);
    if (!at && bt) return 1;
    if (at && !bt) return -1;
    return at.localeCompare(bt);
  });
  const groups = sorted.reduce<Array<{ key: string; items: TopItem[] }>>((acc, item) => {
    const key = clampTargetMonth(item.targetMonth, startOffsetMonths, endOffsetMonths);
    const last = acc[acc.length - 1];
    if (last?.key === key) last.items.push(item);
    else acc.push({ key, items: [item] });
    return acc;
  }, []);

  function addGoalOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    onAdd(true);
  }

  return (
    <div className="card" style={{ background: "transparent" }}>
      <div style={{ fontWeight: 900 }}>{title}</div>

      <div style={{ marginTop: 10 }}>
        {groups.map((group) => (
          <div key={group.key || "none"} className="goalMonthBlock">
            {group.items.map((x) => (
              <div key={x.id} className="goalRow">
                <select
                  className="select goalDateSelect"
                  value={clampTargetMonth(x.targetMonth, startOffsetMonths, endOffsetMonths)}
                  onChange={(e) => onUpdate(x.id, { targetMonth: e.target.value })}
                >
                  <option value="">Month / year</option>
                  {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input
                  className="input"
                  data-goal-item={x.id}
                  value={x.text}
                  onKeyDown={addGoalOnEnter}
                  onChange={(e) => onUpdate(x.id, { text: e.target.value })}
                  placeholder="Goal…"
                />
                <button className="smallBtn danger" onClick={() => onRemove(x.id)}>Delete</button>
              </div>
            ))}
          </div>
        ))}
        <button className="button" onClick={() => onAdd(true)}>+ Add goal</button>
      </div>
    </div>
  );
}

export default function GoalsPage({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";

  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "goals_1_3_5",
      theme: state.theme,
    });
  }

  function add(which: GoalKey, focusNewGoal = false) {
    const item: TopItem = { id: uid(), text: "", targetMonth: "" };
    setState({ ...state, goals: { ...state.goals, [which]: [...state.goals[which], item] } });
    if (focusNewGoal) {
      setTimeout(() => {
        const el = document.querySelector(`[data-goal-item="${item.id}"]`) as HTMLInputElement | null;
        el?.focus();
      }, 0);
    }
  }
  function update(which: GoalKey, id: string, patch: Partial<TopItem>) {
    const rangesByKey: Record<GoalKey, { start: number; end: number }> = {
      short1y: { start: 0, end: 12 },
      mid3y: { start: 13, end: 36 },
      long5y: { start: 37, end: 60 },
    };
    const range = rangesByKey[which];
    const nextPatch = patch.targetMonth !== undefined
      ? { ...patch, targetMonth: clampTargetMonth(patch.targetMonth, range.start, range.end) }
      : patch;
    setState({ ...state, goals: { ...state.goals, [which]: state.goals[which].map((x) => (x.id === id ? { ...x, ...nextPatch } : x)) } });
  }
  function remove(which: GoalKey, id: string) {
    setState({ ...state, goals: { ...state.goals, [which]: state.goals[which].filter((x) => x.id !== id) } });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>
              {name ? `${name}'s Goals (1/3/5 years)` : "Goals (1/3/5 years)"}
            </div>
            <div className="sub">Short (1y) / Mid (3y) / Long (5y).</div>
            {state.updatedAt?.goals ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.goals)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="goalSections">
          <List title="Short 1 year" startOffsetMonths={0} endOffsetMonths={12} items={state.goals.short1y} onAdd={(focus) => add("short1y", focus)} onUpdate={(id, patch) => update("short1y", id, patch)} onRemove={(id) => remove("short1y", id)} />
          <List title="Mid 3 years" startOffsetMonths={13} endOffsetMonths={36} items={state.goals.mid3y} onAdd={(focus) => add("mid3y", focus)} onUpdate={(id, patch) => update("mid3y", id, patch)} onRemove={(id) => remove("mid3y", id)} />
          <List title="Long 5 years" startOffsetMonths={37} endOffsetMonths={60} items={state.goals.long5y} onAdd={(focus) => add("long5y", focus)} onUpdate={(id, patch) => update("long5y", id, patch)} onRemove={(id) => remove("long5y", id)} />
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>
    </div>
  );
}
