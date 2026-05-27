import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, PlaceRow } from "../types";
import { uid } from "../utils/time";

type Props = { state: AppState; setState: (s: AppState) => void };

export default function Places({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "places",
      theme: state.theme,
    });
  }

  function addRow(focusNewRow = false) {
    const row: PlaceRow = { id: uid(), place: "", times: 1, frequency: "weekly", vibe: 3, wantMore: false, notes: "" };
    setState({ ...state, places: [...state.places, row] });
    if (focusNewRow) {
      setTimeout(() => {
        const el = document.querySelector(`[data-place-name="${row.id}"]`) as HTMLInputElement | null;
        el?.focus();
      }, 0);
    }
  }
  function addRowOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addRow(true);
  }
  function update(id: string, patch: Partial<PlaceRow>) {
    setState({ ...state, places: state.places.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }
  function remove(id: string) {
    setState({ ...state, places: state.places.filter((p) => p.id !== id) });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s Places` : 'Places'}</div>
            <div className="sub">Daily / weekly places. Identify where you want more time.</div>
            {state.updatedAt?.places ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.places)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Place</th>
              <th className="th placesTimesCol">Times</th>
              <th className="th">Frequency</th>
              <th className="th">Vibe</th>
              <th className="th">More?</th>
              <th className="th">Notes</th>
              <th className="th" style={{ textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {state.places.map((p) => (
              <tr key={p.id}>
                <td className="td"><input className="input" data-place-name={p.id} value={p.place} onKeyDown={addRowOnEnter} onChange={(e) => update(p.id, { place: e.target.value })} placeholder="Gym / cafe / park…" /></td>
                <td className="td placesTimesCol">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={p.times ?? 1}
                    onFocus={(e) => {
                      if (Number(p.times ?? 0) === 0) e.currentTarget.select();
                    }}
                    onChange={(e) => update(p.id, { times: Number(e.target.value || 0) })}
                  />
                </td>
                <td className="td">
                  <select className="select" value={p.frequency} onChange={(e) => update(p.id, { frequency: e.target.value as any })}>
                    <option value="daily">daily</option><option value="weekly">weekly</option><option value="monthly">monthly</option><option value="rare">rare</option>
                  </select>
                </td>
                <td className="td">
                  <select className="select" value={String(p.vibe)} onChange={(e) => update(p.id, { vibe: Number(e.target.value) })}>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                  </select>
                </td>
                <td className="td">
                  <select className="select" value={p.wantMore ? "yes" : "no"} onChange={(e) => update(p.id, { wantMore: e.target.value === "yes" })}>
                    <option value="no">no</option><option value="yes">yes</option>
                  </select>
                </td>
                <td className="td"><input className="input" value={p.notes} onKeyDown={addRowOnEnter} onChange={(e) => update(p.id, { notes: e.target.value })} placeholder="Why?" /></td>
                <td className="td"><div className="rowActions"><button className="smallBtn danger" onClick={() => remove(p.id)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={() => addRow(true)}>+ Add place</button>
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
