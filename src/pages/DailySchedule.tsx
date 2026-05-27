import React, { useEffect, useMemo, useRef, useState } from "react";
import { exportElementToJpeg } from "../utils/export";
import type { AppState, TimeBlock, TodayData } from "../types";
import TimeField from "../components/TimeField";
import { formatUpdatedAt } from "../utils/format";
import { blockRelRange, dayKeyForToday, oneLine, overlaps, prettyTime, relMinutes, sleepRelMinutes, uid, minutesToHHMM, sortByStart } from "../utils/time";

type Props = { state: AppState; setState: (next: AppState) => void };

function validateTimes(today: TodayData): { ok: true } | { ok: false; message: string } {
  const sleepRel = sleepRelMinutes(today.wakeTime, today.sleepTime);
  if (!Number.isFinite(sleepRel)) return { ok: false, message: "Invalid Wake/Sleep time." };
  const blocks = sortByStart(today.blocks);

  for (const b of blocks) {
    const { rs, re } = blockRelRange(b.start, b.end, today.wakeTime);
    if (!Number.isFinite(rs) || !Number.isFinite(re)) return { ok: false, message: "Invalid block time." };
    if (rs >= re) return { ok: false, message: `Invalid block: ${b.start} - ${b.end}.` };
  }

  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const A = blockRelRange(a.start, a.end, today.wakeTime);
    for (let j = i + 1; j < blocks.length; j++) {
      const b = blocks[j];
      const B = blockRelRange(b.start, b.end, today.wakeTime);
      if (overlaps(A.rs, A.re, B.rs, B.re)) {
        return { ok: false, message: `Blocks overlap: ${a.start}-${a.end} vs ${b.start}-${b.end}` };
      }
    }
  }
  return { ok: true };
}

function defaultEnd(start: string, wake: string, sleep: string): string {
  const startRel = relMinutes(start, wake);
  const sleepRel = sleepRelMinutes(wake, sleep);
  let endRel = startRel + 60;
  if (Number.isFinite(sleepRel)) endRel = Math.min(endRel, sleepRel);
  return minutesToHHMM(endRel);
}

export default function DailySchedule({ state, setState }: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: previewRef.current,
      filenameBase: (name ? `${name}_` : "") + "dream_day_schedule",
      theme: state.theme,
    });
  }

  const friendlyName = state.name === "(skip)" ? "" : (state.name || "");
  const todayKey = dayKeyForToday();
  const today = state.schedules[todayKey];
  const updatedIso = state.updatedAt?.schedule || today.lastSavedAt;
  const [status, setStatus] = useState<string | null>(null);

  const sortedBlocks = useMemo(() => sortByStart(today.blocks), [today.blocks]);
  const sleepRel = useMemo(() => sleepRelMinutes(today.wakeTime, today.sleepTime), [today.wakeTime, today.sleepTime]);

  const canAddMore = useMemo(() => {
    if (!Number.isFinite(sleepRel)) return false;
    if (sortedBlocks.length === 0) return true;
    const last = sortedBlocks[sortedBlocks.length - 1];
    const lastEnd = relMinutes(last.end, today.wakeTime);
    const wakeRel = relMinutes(today.wakeTime, today.wakeTime);
    const lastEndAdj = lastEnd < wakeRel ? lastEnd + 1440 : lastEnd;
    return lastEndAdj < sleepRel;
  }, [sleepRel, sortedBlocks, today.wakeTime]);

  const reachedSleep = useMemo(() => {
    if (!Number.isFinite(sleepRel) || sortedBlocks.length === 0) return false;
    const last = sortedBlocks[sortedBlocks.length - 1];
    const lastEnd = relMinutes(last.end, today.wakeTime);
    const wakeRel = relMinutes(today.wakeTime, today.wakeTime);
    const lastEndAdj = lastEnd < wakeRel ? lastEnd + 1440 : lastEnd;
    return lastEndAdj >= sleepRel;
  }, [sleepRel, sortedBlocks, today.wakeTime]);

  function updateToday(patch: Partial<TodayData>) {
    const nextToday: TodayData = { ...today, ...patch, lastSavedAt: new Date().toISOString() };
    setState({ ...state, schedules: { ...state.schedules, [todayKey]: nextToday } });
  }

  function updateBlock(id: string, patch: Partial<TimeBlock>) {
    updateToday({ blocks: today.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function chainUpdateNextStart(changedId: string, newEnd: string) {
    const blocks = sortByStart(today.blocks);
    const idx = blocks.findIndex((b) => b.id === changedId);
    if (idx === -1) return;

    const next = blocks[idx + 1];
    if (!next) {
      updateBlock(changedId, { end: newEnd });
      return;
    }

    const nextStart = newEnd;
    const nextRange = blockRelRange(nextStart, next.end, today.wakeTime);
    let nextEnd = next.end;
    if (!Number.isFinite(nextRange.re) || nextRange.re <= nextRange.rs) nextEnd = defaultEnd(nextStart, today.wakeTime, today.sleepTime);

    updateToday({
      blocks: today.blocks.map((b) => {
        if (b.id === changedId) return { ...b, end: newEnd };
        if (b.id === next.id) return { ...b, start: nextStart, end: nextEnd };
        return b;
      }),
    });
  }

  function addBlock() {
    if (!canAddMore) return;
    const v = validateTimes(today);
    if (!v.ok) return setStatus(v.message);

    const last = sortedBlocks.length > 0 ? sortedBlocks[sortedBlocks.length - 1] : null;
    const start = last ? last.end : today.wakeTime;

    const b: TimeBlock = { id: uid(), start, end: defaultEnd(start, today.wakeTime, today.sleepTime), activity: "", withWho: "" };
    updateToday({ blocks: [...today.blocks, b] });
    setStatus(null);

    setTimeout(() => {
      const el = document.querySelector(`[data-activity="${b.id}"]`) as HTMLTextAreaElement | null;
      el?.focus();
    }, 0);
  }

  useEffect(() => {
    const fn = () => addBlock();
    window.addEventListener("dreamday:addblock", fn as any);
    return () => window.removeEventListener("dreamday:addblock", fn as any);
  }, [canAddMore, today, sortedBlocks]);

  function removeBlock(id: string) {
    updateToday({ blocks: today.blocks.filter((b) => b.id !== id) });
  }

  return (
    <div>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>
              {friendlyName.trim() ? `${friendlyName.trim()}'s Dream Day Schedule` : "Dream Day Schedule"}
            </div>
            <div className="sub">Design one ideal day from wake → sleep. Press Enter in Activity to create the next block.</div>
            {updatedIso ? <div className="sub">Updated {formatUpdatedAt(updatedIso)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid2">
          <div>
            <div className="label">Wake</div>
            <TimeField value24={today.wakeTime} onChange24={(v) => updateToday({ wakeTime: v })} />
          </div>
          <div>
            <div className="label">Sleep</div>
            <TimeField value24={today.sleepTime} onChange24={(v) => updateToday({ sleepTime: v })} />
          </div>
        </div>
        {reachedSleep && <div className="noticeOk">✓ Reached sleep time.</div>}
        {status && <div className="noticeErr">! {status}</div>}
      </div>

      <div className="card">
        <div className="label">Blocks</div>

        {sortedBlocks.map((b) => (
          <div key={b.id} className="card" style={{ background: "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>
                {b.start}–{b.end}
                <span style={{ color: "var(--muted)", fontWeight: 800, marginLeft: 10 }}>
                  {b.withWho.trim() ? `with: ${b.withWho.trim()}` : "solo"}
                </span>
              </div>
              <button className="smallBtn danger" onClick={() => removeBlock(b.id)}>Delete</button>
            </div>

            <div className="hr" />

            <div className="grid2">
              <div>
                <div className="label">Start</div>
                <TimeField
                  value24={b.start}
                  onChange24={(val) => {
                    updateBlock(b.id, { start: val });
                    const r = blockRelRange(val, b.end, today.wakeTime);
                    if (!Number.isFinite(r.re) || r.re <= r.rs) {
                      const newEnd = defaultEnd(val, today.wakeTime, today.sleepTime);
                      chainUpdateNextStart(b.id, newEnd);
                    }
                  }}
                />
              </div>
              <div>
                <div className="label">End</div>
                <TimeField value24={b.end} onChange24={(val) => chainUpdateNextStart(b.id, val)} />
              </div>
            </div>

            <div className="grid2" style={{ marginTop: 10 }}>
              <div>
                <div className="label">With</div>
                <input className="input" value={b.withWho} placeholder="Family / friends / coworkers…" onChange={(e) => updateBlock(b.id, { withWho: e.target.value })} />
              </div>
              <div>
                <div className="label">Activity</div>
                <textarea
                  className="textarea"
                  data-activity={b.id}
                  value={b.activity}
                  placeholder="Deep work / meeting / workout / family time…"
                  onChange={(e) => updateBlock(b.id, { activity: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addBlock();
                    }
                  }}
                  style={{ minHeight: 70 }}
                />
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={addBlock} disabled={!canAddMore}>+ Add block</button>
        </div>

        <div className="hr" />
        <div className="label">Preview</div>

        <div className="wpWrap" ref={previewRef}>
          <div className="wpCard">
            <div className="wpTitle">{friendlyName.trim() ? `${friendlyName.trim()}'s Dream Day Schedule` : "Dream Day Schedule"}</div>
            <div className="wpSub">
              Your desired day
              {updatedIso ? ` · Updated ${formatUpdatedAt(updatedIso)}` : ""}
            </div>
            <div className="wpLine" />
            {sortedBlocks.map((x, i) => (
              <div className="wpItem" key={i}>
                <div className="wpTime">{x.start}–{x.end}</div>
                <div className="wpAct">
                  {oneLine(x.activity) || "—"}
                  {x.withWho.trim() ? <span className="wpWith"> · {oneLine(x.withWho)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
