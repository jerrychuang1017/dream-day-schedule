import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState, CityRow } from "../types";
import { makeDefaultCity } from "../storage";

type Props = { state: AppState; setState: (s: AppState) => void };

export default function FavoriteCity({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  const criteria = state.cityCriteria || [];
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "favorite_city",
      theme: state.theme,
    });
  }

  function addCity() {
    setState({ ...state, cities: [...state.cities, makeDefaultCity(criteria)] });
  }
  function update(id: string, patch: Partial<CityRow>) {
    setState({ ...state, cities: state.cities.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }
  function setScore(id: string, criterion: string, val: number) {
    setState({ ...state, cities: state.cities.map((c) => c.id === id ? { ...c, scores: { ...c.scores, [criterion]: val } } : c) });
  }
  function remove(id: string) {
    setState({ ...state, cities: state.cities.filter((c) => c.id !== id) });
  }
  function addCriterion() {
    if (criteria.length >= 15) return;
    const label = `Field ${criteria.length + 1}`;
    setState({
      ...state,
      cityCriteria: [...criteria, label],
      cities: state.cities.map((c) => ({ ...c, scores: { ...c.scores, [label]: 3 } })),
    });
  }
  function updateCriterion(index: number, next: string) {
    const oldName = criteria[index];
    const nextName = next;
    const nextCriteria = criteria.map((x, i) => (i === index ? nextName : x));
    setState({
      ...state,
      cityCriteria: nextCriteria,
      cities: state.cities.map((c) => {
        const scores = { ...c.scores };
        if (oldName !== nextName) {
          scores[nextName] = Number(scores[oldName] ?? 3);
          delete scores[oldName];
        }
        return { ...c, scores };
      }),
    });
  }
  function removeCriterion(name: string) {
    setState({
      ...state,
      cityCriteria: criteria.filter((x) => x !== name),
      cities: state.cities.map((c) => {
        const scores = { ...c.scores };
        delete scores[name];
        return { ...c, scores };
      }),
    });
  }
  return (
    <div>
      <div ref={exportRef}>
        <div className="card" style={{ background: "transparent" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s Favorite city` : 'Favorite city'}</div>
              <div className="sub">Rank cities by criteria (1–5).</div>
              {state.updatedAt?.cities ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.cities)}</div> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="label">City ranking (by total score)</div>
          <div className="hr" />
          <table className="table">
            <thead>
              <tr>
                <th className="th">Rank</th>
                <th className="th">City</th>
                <th className="th">Total</th>
                <th className="th">Avg</th>
                <th className="th">Notes</th>
              </tr>
            </thead>
            <tbody>
              {([...state.cities]
                .map((c) => {
                  const vals = criteria.map((k) => Number(c.scores[k] ?? 0));
                  const total = vals.reduce((a, b) => a + b, 0);
                  const maxTotal = criteria.length * 5;
                  const avg = vals.length ? total / vals.length : 0;
                  return { id: c.id, city: c.city || "—", total, maxTotal, avg, notes: c.notes || "—" };
                })
                .sort((a, b) => b.total - a.total)
              ).map((r, idx) => (
                <tr key={r.id}>
                  <td className="td">{idx + 1}</td>
                  <td className="td">{r.city}</td>
                  <td className="td">{r.total} / {r.maxTotal}</td>
                  <td className="td">{r.avg.toFixed(1)}</td>
                  <td className="td">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {state.cities.map((c) => (
            <div key={c.id} className="card" style={{ background: "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <input className="input" value={c.city} onChange={(e) => update(c.id, { city: e.target.value })} placeholder="City name" />
                <button className="smallBtn danger" onClick={() => remove(c.id)}>Delete</button>
              </div>

              <div className="hr" />

              <div className="grid2">
                {criteria.map((k) => (
                  <div key={k}>
                    <div className="label">{k}</div>
                    <select className="select" value={String(c.scores[k] ?? 3)} onChange={(e) => setScore(c.id, k, Number(e.target.value))}>
                      <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <div className="label">Notes</div>
                <textarea className="textarea" value={c.notes} onChange={(e) => update(c.id, { notes: e.target.value })} placeholder="Why you like it…" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={addCity}>+ Add city</button>
        </div>

        <div className="hr cityFieldsDivider" />

        <details className="cityFieldsDetails">
          <summary>Update fields</summary>
          <div className="cityCriteriaList">
            {criteria.map((criterion, index) => (
              <div key={`${criterion}-${index}`} className="cityCriterionRow">
                <input
                  className="input"
                  value={criterion}
                  onChange={(e) => updateCriterion(index, e.target.value)}
                  placeholder="Field name"
                />
                <button className="smallBtn danger" onClick={() => removeCriterion(criterion)}>Delete</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button" onClick={addCriterion} disabled={criteria.length >= 15}>+ Add field</button>
          </div>
        </details>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
