import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, PersonRow } from "../types";
import { uid } from "../utils/time";

type Props = { state: AppState; setState: (s: AppState) => void };

export default function PeopleRelationship({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "people_relationship",
      theme: state.theme,
    });
  }

  function addRow(focusNewRow = false) {
    const row: PersonRow = { id: uid(), name: "", relationship: "", positive: true, notes: "" };
    setState({ ...state, people: [...state.people, row] });
    if (focusNewRow) {
      setTimeout(() => {
        const el = document.querySelector(`[data-person-name="${row.id}"]`) as HTMLInputElement | null;
        el?.focus();
      }, 0);
    }
  }
  function addRowOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addRow(true);
  }
  function update(id: string, patch: Partial<PersonRow>) {
    setState({ ...state, people: state.people.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function remove(id: string) {
    setState({ ...state, people: state.people.filter((r) => r.id !== id) });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s People relationship` : 'People relationship'}</div>
            <div className="sub">Keep people who help you grow. Avoid energy drains.</div>
            {state.updatedAt?.people ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.people)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Name</th>
              <th className="th">Relationship</th>
              <th className="th">Keep close?</th>
              <th className="th">Notes</th>
              <th className="th" style={{ textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {state.people.map((r) => (
              <tr key={r.id}>
                <td className="td"><input className="input" data-person-name={r.id} value={r.name} onKeyDown={addRowOnEnter} onChange={(e) => update(r.id, { name: e.target.value })} /></td>
                <td className="td"><input className="input" value={r.relationship} onKeyDown={addRowOnEnter} onChange={(e) => update(r.id, { relationship: e.target.value })} placeholder="Friend / mentor / coworker…" /></td>
                <td className="td">
                  <select className="select" value={r.positive ? "yes" : "no"} onChange={(e) => update(r.id, { positive: e.target.value === "yes" })}>
                    <option value="yes">Yes</option>
                    <option value="no">No (avoid)</option>
                  </select>
                </td>
                <td className="td"><input className="input" value={r.notes} onKeyDown={addRowOnEnter} onChange={(e) => update(r.id, { notes: e.target.value })} placeholder="Why this matters…" /></td>
                <td className="td"><div className="rowActions"><button className="smallBtn danger" onClick={() => remove(r.id)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={() => addRow(true)}>+ Add person</button>
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
