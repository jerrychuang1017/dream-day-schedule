import React, {useMemo, useRef} from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState } from "../types";
import { formatNumberWithCommas, parseNumberInput } from "../utils/number";

type Props = { state: AppState; setState: (s: AppState) => void };

function estimateYearsToFire(current: number, monthly: number, target: number, annualR: number): number | null {
  if (target <= 0) return null;
  if (current >= target) return 0;
  const r = Math.max(0, annualR);
  const monthlyR = Math.pow(1 + r, 1 / 12) - 1;
  let v = Math.max(0, current);
  for (let m = 1; m <= 1200; m++) {
    v = v * (1 + monthlyR) + Math.max(0, monthly);
    if (v >= target) return m / 12;
  }
  return null;
}

export default function Finance({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "fire_planning",
      theme: state.theme,
    });
  }

  const f = state.finance;

  const years = useMemo(() => {
    const r = (Number(f.annualReturnPct) || 0) / 100;
    return estimateYearsToFire(Number(f.currentNetWorth) || 0, Number(f.monthlyInvest) || 0, Number(f.fireNumber) || 0, r);
  }, [f.currentNetWorth, f.monthlyInvest, f.fireNumber, f.annualReturnPct]);

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>{name ? `${name}'s FIRE planning` : 'FIRE planning'}</div>
            <div className="sub">Simple planning. No accounts connected.</div>
            {state.updatedAt?.finance ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.finance)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid2">
          <div>
            <div className="label">FIRE number (target)</div>
            <input className="input" value={formatNumberWithCommas(f.fireNumber)} onFocus={(e) => { if (f.fireNumber === 0) e.currentTarget.select(); }} onChange={(e) => setState({ ...state, finance: { ...f, fireNumber: parseNumberInput(e.target.value) } })} />
          </div>
          <div>
            <div className="label">Current net worth</div>
            <input className="input" value={formatNumberWithCommas(f.currentNetWorth)} onFocus={(e) => { if (f.currentNetWorth === 0) e.currentTarget.select(); }} onChange={(e) => setState({ ...state, finance: { ...f, currentNetWorth: parseNumberInput(e.target.value) } })} />
          </div>
          <div>
            <div className="label">Monthly invest</div>
            <input className="input" value={formatNumberWithCommas(f.monthlyInvest)} onFocus={(e) => { if (f.monthlyInvest === 0) e.currentTarget.select(); }} onChange={(e) => setState({ ...state, finance: { ...f, monthlyInvest: parseNumberInput(e.target.value) } })} />
          </div>
          <div>
            <div className="label">Annual return %</div>
            <input className="input" type="number" value={f.annualReturnPct} onChange={(e) => setState({ ...state, finance: { ...f, annualReturnPct: Number(e.target.value) } })} />
          </div>
        </div>

        <div className="hr" />

        <div className="card" style={{ background: "transparent" }}>
          <div className="label">Estimated time to FIRE</div>
          <div style={{ fontWeight: 900, fontSize: 14 }}>{years === null ? "—" : `${years.toFixed(1)} years`}</div>
          <div className="sub" style={{ marginTop: 6 }}>Simple monthly simulation. Not financial advice.</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="label">Notes</div>
          <textarea className="textarea" value={f.notes} onChange={(e) => setState({ ...state, finance: { ...f, notes: e.target.value } })} placeholder="Strategy, milestones, guardrails…" />
        </div>
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>

    </div>
  );
}
