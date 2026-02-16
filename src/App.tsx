import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { TimeBlock, TodayData } from "./types";
import { clearName, clearToday, getName, loadToday, saveToday, setName } from "./storage";
import {
  blockRelRange,
  overlaps,
  oneLine,
  prettyTime,
  relMinutes,
  sleepRelMinutes,
  sortByStart,
  uid,
  minutesToHHMM,
} from "./time";
import TimeField from "./TimeField";

type Validation = { ok: true } | { ok: false; message: string };

function validate(data: TodayData): Validation {
  const sleepRel = sleepRelMinutes(data.wakeTime, data.sleepTime);
  if (!Number.isFinite(sleepRel)) return { ok: false, message: "Invalid Wake/Sleep time." };

  const blocks = sortByStart(data.blocks);

  for (const b of blocks) {
    const { rs, re } = blockRelRange(b.start, b.end, data.wakeTime);
    if (!Number.isFinite(rs) || !Number.isFinite(re)) return { ok: false, message: "Invalid block time." };
    if (rs >= re) return { ok: false, message: `Invalid block: ${b.start} - ${b.end}.` };  }

  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const A = blockRelRange(a.start, a.end, data.wakeTime);
    for (let j = i + 1; j < blocks.length; j++) {
      const b = blocks[j];
      const B = blockRelRange(b.start, b.end, data.wakeTime);
      if (overlaps(A.rs, A.re, B.rs, B.re)) {
        return { ok: false, message: `Blocks overlap: ${a.start}-${a.end} vs ${b.start}-${b.end}` };
      }
    }
  }

  return { ok: true };
}

function buildTitle(name: string): string {
  const n = name.trim();
  return n ? `${n}'s Dream Day Schedule` : "Dream Day Schedule";
}

function defaultEnd(start: string, wake: string, sleep: string): string {
  const startRel = relMinutes(start, wake);
  const sleepRel = sleepRelMinutes(wake, sleep);
  let endRel = startRel + 60; // 1 hour
  if (Number.isFinite(sleepRel)) endRel = Math.min(endRel, sleepRel);
  return minutesToHHMM(endRel);
}

export default function App() {
  const wallpaperRef = useRef<HTMLDivElement | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  const [name, setNameState] = useState<string>(() => getName());
  const [nameDraft, setNameDraft] = useState<string>(() => getName());
  const [data, setData] = useState<TodayData>(() => ({ wakeTime: "08:00", sleepTime: "23:00", blocks: [] }));
  const [status, setStatus] = useState<null | { kind: "err"; text: string }>(null);
  const [exporting, setExporting] = useState(false);
const [theme, setTheme] = useState<"dark" | "light">(() => {
  const t = localStorage.getItem("dreamday_theme_v1");
  return t === "light" ? "light" : "dark";
});


  useEffect(() => {
    setData(loadToday());
  }, []);

  useEffect(() => {
    document.title = buildTitle(name);
  }, [name]);
useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dreamday_theme_v1", theme);
}, [theme]);


  const sortedBlocks = useMemo(() => sortByStart(data.blocks), [data.blocks]);

  const updatedLabel = useMemo(() => {
    const iso = data.lastSavedAt;
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `Updated at ${prettyTime(d)}`;
  }, [data.lastSavedAt]);


const sleepRel = useMemo(() => sleepRelMinutes(data.wakeTime, data.sleepTime), [data.wakeTime, data.sleepTime]);

const canAddMore = useMemo(() => {
  if (!Number.isFinite(sleepRel)) return false;
  if (sortedBlocks.length === 0) return relMinutes(data.wakeTime, data.wakeTime) < sleepRel;
  const last = sortedBlocks[sortedBlocks.length - 1];
  const lastEndRel = relMinutes(last.end, data.wakeTime);
  const lastEndRelAdj = lastEndRel < relMinutes(data.wakeTime, data.wakeTime) ? lastEndRel + 1440 : lastEndRel;
  return lastEndRelAdj < sleepRel;
}, [sleepRel, sortedBlocks, data.wakeTime]);

const finished = useMemo(() => {
  if (!Number.isFinite(sleepRel)) return false;
  if (sortedBlocks.length === 0) return false;
  const last = sortedBlocks[sortedBlocks.length - 1];
  const lastEnd = relMinutes(last.end, data.wakeTime);
  const wakeRel = relMinutes(data.wakeTime, data.wakeTime);
  const lastEndAdj = lastEnd < wakeRel ? lastEnd + 1440 : lastEnd;
  return lastEndAdj >= sleepRel;
}, [sleepRel, sortedBlocks, data.wakeTime]);

  useEffect(() => {
    if (!name.trim()) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    autosaveTimer.current = window.setTimeout(() => {
      const v = validate({ ...data, blocks: sortedBlocks });
    if (!v.ok) { setStatus({ kind: "err", text: v.message }); return; }
      setStatus(null);
      const nowIso = new Date().toISOString();
      const next: TodayData = { ...data, blocks: sortedBlocks, lastSavedAt: nowIso };
      setData(next);
      saveToday(next);
    }, 450);

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.wakeTime, data.sleepTime, data.blocks, name]);

  function updateBlock(id: string, patch: Partial<TimeBlock>) {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }

  function chainUpdateNextStart(changedId: string, newEnd: string) {
    const blocks = sortByStart(data.blocks);
    const idx = blocks.findIndex((b) => b.id === changedId);
    if (idx === -1) return;

    const next = blocks[idx + 1];
    if (!next) {
      updateBlock(changedId, { end: newEnd });
      return;
    }

    const nextStart = newEnd;
    const nextRange = blockRelRange(nextStart, next.end, data.wakeTime);
    let nextEnd = next.end;
    if (!Number.isFinite(nextRange.re) || nextRange.re <= nextRange.rs) {
      nextEnd = defaultEnd(nextStart, data.wakeTime, data.sleepTime);
    }

    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id === changedId) return { ...b, end: newEnd };
        if (b.id === next.id) return { ...b, start: nextStart, end: nextEnd };
        return b;
      }),
    }));
  }

  function focusActivity(id: string) {
    setTimeout(() => {
      const el = document.querySelector(`[data-activity="${id}"]`) as HTMLTextAreaElement | null;
      el?.focus();
    }, 0);
  }

  function addBlock() {    const v = validate({ ...data, blocks: sortedBlocks });
    if (!v.ok) { setStatus({ kind: "err", text: v.message }); return; }

    const last = sortedBlocks.length > 0 ? sortedBlocks[sortedBlocks.length - 1] : null;
    const start = last ? last.end : data.wakeTime;

    const b: TimeBlock = {
      id: uid(),
      start,
      end: defaultEnd(start, data.wakeTime, data.sleepTime),
      activity: "",
      withWho: "",
    };

    setData((prev) => ({ ...prev, blocks: [...prev.blocks, b] }));
    setStatus(null);
    focusActivity(b.id);
  }

  function addFirstBlock() {
    const b: TimeBlock = {
      id: uid(),
      start: data.wakeTime,
      end: defaultEnd(data.wakeTime, data.wakeTime, data.sleepTime),
      activity: "",
      withWho: "",
    };
    setData((prev) => ({ ...prev, blocks: [...prev.blocks, b] }));
    setStatus(null);
    focusActivity(b.id);
  }

  function onAddBlock() {
  if (!canAddMore) return;
  if (sortedBlocks.length === 0) addFirstBlock();
  else addBlock();
}

  function removeBlock(id: string) {
    setData((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== id) }));
    setStatus(null);
  }

  function onClear() {
    clearToday();
    setData({ wakeTime: "08:00", sleepTime: "23:00", blocks: [] });
    setStatus(null);  }

  function onRestart() {
    onClear();
    clearName();
    setNameState("");
    setNameDraft("");
  }

  async function exportWallpaperJPEG() {
    if (!wallpaperRef.current) return;
    try {
      setExporting(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const canvas = await html2canvas(wallpaperRef.current, {
        backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = jpegDataUrl;
      a.download = `${buildTitle(name).replace(/\s+/g, "_")}_wallpaper.jpg`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  function confirmName() {
    const n = nameDraft.trim();
    if (!n) return;
    setName(n);
    setNameState(n);
  }

  const showNameModal = !name.trim();

  const wallpaperLines = useMemo(() => {
    return sortedBlocks.map((b) => {
      const act = oneLine(b.activity);
      const who = oneLine(b.withWho);
      return { time: `${b.start}–${b.end}`, text: act, withWho: who };
    });
  }, [sortedBlocks]);

  return (
    <div className="container">
      {showNameModal && (
        <div className="modalOverlay">
          <div className="modal">
            <h2 className="modalTitle">What’s your name?</h2>
            <div className="modalSub">We’ll personalize the title for you.</div>
            <div style={{ marginTop: 10 }}>
              <input
                className="input"
                value={nameDraft}
                placeholder="Type your name…"
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmName();
                }}
                autoFocus
              />
            </div>
            <div className="btnRow" style={{ marginTop: 10 }}>
              <button className="button primary" onClick={confirmName} disabled={!nameDraft.trim()}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shell">
        <div className="body">
          <div className="header">
            <div className="titleWrap">
              <h1 className="h1">{buildTitle(name)}</h1>
              <div className="sub">Your desired day{updatedLabel ? ` · ${updatedLabel}` : ""}</div>
            
<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <button
    className="button"
    onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    title="Toggle theme"
  >
    {theme === "dark" ? "Light" : "Dark"}
  </button>
</div>
</div>
          </div>

          <div className="grid2">
            <div>
              <div className="label">Wake</div>
              <TimeField value24={data.wakeTime} onChange24={(v) => setData((p) => ({ ...p, wakeTime: v }))} />
            </div>
            <div>
              <div className="label">Sleep</div>
              <TimeField value24={data.sleepTime} onChange24={(v) => setData((p) => ({ ...p, sleepTime: v }))} />
            </div>
          </div>

          <div className="btnRow">
            <button className="button" onClick={onAddBlock} disabled={!canAddMore}>+ Add block</button>
            <button className="button primary" onClick={exportWallpaperJPEG} disabled={exporting}>
              {exporting ? "Exporting…" : "Export (JPEG)"}
            </button>
            <button className="button danger" onClick={onClear}>Clear</button>
            <button className="button" onClick={onRestart}>Restart</button>
          

{finished && (
  <div className="notice" style={{ borderColor: "rgba(34,197,94,0.35)", color: "rgba(34,197,94,0.95)" }}>
    ✓ Finish.
  </div>
)}
</div>

          {status?.kind === "err" && <div className="notice err">! {status.text}</div>}

          <div className="hr" />

          <div className="blocksTitle">Blocks</div>

          {sortedBlocks.length === 0 ? (
            <div className="notice">No blocks yet.</div>
          ) : (
            <div>
              {sortedBlocks.map((b) => (
                <div className="block" key={b.id}>
                  <div className="blockTop">
                    <div className="badge">
                      <span>{b.start}–{b.end}</span>
                      <span className="meta">{b.withWho.trim() ? `with: ${b.withWho.trim()}` : "solo"}</span>
                    </div>
                    <button className="button danger" onClick={() => removeBlock(b.id)}>Delete</button>
                  </div>

                  <div className="row3">
                    <div>
                      <div className="label">Start</div>
                      <TimeField
                        value24={b.start}
                        onChange24={(val) => {
                          updateBlock(b.id, { start: val });
                          const r = blockRelRange(val, b.end, data.wakeTime);
                          if (!Number.isFinite(r.re) || r.re <= r.rs) {
                            const newEnd = defaultEnd(val, data.wakeTime, data.sleepTime);
                            chainUpdateNextStart(b.id, newEnd);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="label">End</div>
                      <TimeField value24={b.end} onChange24={(val) => chainUpdateNextStart(b.id, val)} />
                    </div>
                    <div>
                      <div className="label">With</div>
                      <input
                        className="input"
                        value={b.withWho}
                        placeholder="Family / friends / coworkers…"
                        onChange={(e) => updateBlock(b.id, { withWho: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
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
                          onAddBlock();
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wallpaperWrap" ref={wallpaperRef} aria-hidden="true">
        <div className="wpCard">
          <div className="wpTitle">{buildTitle(name)}</div>
          <div className="wpSub">Your desired day{updatedLabel ? ` · ${updatedLabel}` : ""}</div>
          <div className="wpLine" />
          {wallpaperLines.length === 0 ? (
            <div className="wpItem">
              <div className="wpTime">—</div>
              <div className="wpAct">No blocks yet.</div>
            </div>
          ) : (
            wallpaperLines.map((x, i) => (
              <div className="wpItem" key={i}>
                <div className="wpTime">{x.time}</div>
                <div className="wpAct">
                  {x.text || "—"}
                  {x.withWho ? <span className="wpWith"> · {x.withWho}</span> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
