import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState } from "../types";

type Props = { state: AppState; setState: (s: AppState) => void };

export default function Top10MustDo({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "top10_must_do",
      theme: state.theme,
    });
  }

  function focusNextOnEnter(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = state.top10[index + 1];
    if (!next) return;
    const el = document.querySelector(`[data-top10-item="${next.id}"]`) as HTMLInputElement | null;
    el?.focus();
  }
  function update(id: string, text: string) {
    setState({ ...state, top10: state.top10.map((x) => (x.id === id ? { ...x, text } : x)) });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s Top 10 must do` : 'Top 10 must do'}</div>
            <div className="sub">Your top-10 list of things you want to achieve. Toggle Done when you complete one.</div>
            {state.updatedAt?.top10 ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.top10)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        {state.top10.map((x, i) => (
          <div key={x.id} className="card" style={{ background: "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>#{i + 1}</div>
              <button
                className={"doneCheckBtn doneBtn " + (x.done ? "isDone" : "")}
                aria-label={x.done ? "Done" : "Mark done"}
                onClick={() => setState({ ...state, top10: state.top10.map(t => t.id === x.id ? { ...t, done: !t.done } : t) })}
              >
                {x.done ? "✓" : ""}
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <input
                className="input"
                data-top10-item={x.id}
                value={x.text}
                onKeyDown={(e) => focusNextOnEnter(e, i)}
                onChange={(e) => update(x.id, e.target.value)}
                placeholder="What’s your must-do?"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
