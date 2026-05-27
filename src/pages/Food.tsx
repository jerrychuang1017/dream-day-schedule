import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, FoodRow } from "../types";
import { uid } from "../utils/time";

type Props = { state: AppState; setState: (s: AppState) => void };

export default function Food({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "top_restaurants",
      theme: state.theme,
    });
  }

  function addRow() {
    const row: FoodRow = { id: uid(), restaurant: "", city: "", mustOrder: "" };
    setState({ ...state, foods: [...state.foods, row].slice(0, 5) });
  }
  function update(id: string, patch: Partial<FoodRow>) {
    setState({ ...state, foods: state.foods.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function remove(id: string) {
    setState({ ...state, foods: state.foods.filter((r) => r.id !== id) });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s Top 5 restaurants` : 'Top 5 restaurants'}</div>
            <div className="sub">Remember, enjoy, and cherish your five favorite restaurants and dishes.</div>
            {state.updatedAt?.food ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.food)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <button className="button" onClick={addRow} disabled={state.foods.length >= 5}>+ Add restaurant</button>
        <div className="hr" />

        <table className="table">
          <thead>
            <tr>
              <th className="th">Restaurant</th>
              <th className="th foodCityCol">City</th>
              <th className="th foodMustOrderCol">Must order</th>
              <th className="th" style={{ textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {state.foods.map((r) => (
              <tr key={r.id}>
                <td className="td"><input className="input" value={r.restaurant} onChange={(e) => update(r.id, { restaurant: e.target.value })} /></td>
                <td className="td foodCityCol"><input className="input" value={r.city} onChange={(e) => update(r.id, { city: e.target.value })} /></td>
                <td className="td foodMustOrderCol"><input className="input" value={r.mustOrder} onChange={(e) => update(r.id, { mustOrder: e.target.value })} placeholder="Your favorite dish" /></td>
                <td className="td"><div className="rowActions"><button className="smallBtn danger" onClick={() => remove(r.id)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
