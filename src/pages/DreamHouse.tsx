import React, { useRef } from "react";
import { exportElementToJpeg } from "../utils/export";
import { formatUpdatedAt } from "../utils/format";
import type { AppState } from "../types";
import { formatNumberWithCommas, parseNumberInput } from "../utils/number";

type Props = {
  state: AppState;
  setState: (s: AppState) => void;
};

function ListEditor({ title, items, onChange }: { title: string; items: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="card" style={{ background: "transparent" }}>
      <div className="dreamListHeader">
        <div className="label" style={{ margin: 0 }}>{title}</div>
      </div>
      <div className="hr" />
      {items.map((t, idx) => (
        <div key={idx} className="dreamListRow">
          <input
            className="input"
            value={t}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder="Gym / sauna / pool…"
          />
          <button className="smallBtn danger" onClick={() => onChange(items.filter((_, i) => i !== idx))}>Delete</button>
        </div>
      ))}
      <button className="button" onClick={() => onChange([...items, ""])}>+ Add</button>
    </div>
  );
}

export default function DreamHouse({ state, setState }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const name = state.name && state.name !== "(skip)" ? state.name : "";
  const d = state.dreamHouse;

  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "dream_house",
      theme: state.theme,
    });
  }

  function setDH(patch: Partial<typeof d>) {
    setState({ ...state, dreamHouse: { ...d, ...patch } });
  }

  return (
    <div ref={exportRef}>
      <div className="card" style={{ background: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="h1" style={{ fontSize: 13, marginBottom: 6 }}>
              {name ? `${name}'s Dream house` : "Dream house"}
            </div>
            <div className="sub">Turn your dream into a clean spec: size, rooms, and checklists. Add features (gym/theater/pool) into Must/Nice.</div>
            {state.updatedAt?.dreamhouse ? <div className="sub">Updated {formatUpdatedAt(state.updatedAt.dreamhouse)}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid2">
          <div>
            <div className="label">City</div>
            <input className="input" value={d.location} onChange={(e) => setDH({ location: e.target.value })} placeholder="Taipei / San Diego / Vancouver…" />
          </div>
          <div>
            <div className="label">Environment</div>
            <input className="input" value={d.environment} onChange={(e) => setDH({ environment: e.target.value })} placeholder="Ocean / mountain / city / rural…" />
          </div>
          <div>
            <div className="label">Type</div>
            <input className="input" value={d.propertyType} onChange={(e) => setDH({ propertyType: e.target.value })} placeholder="Buy land & build / house / apartment…" />
          </div>

          <div>
            <div className="label">Budget</div>
            <input className="input" value={formatNumberWithCommas(d.budgetTWD)} onFocus={(e) => { if (d.budgetTWD === 0) e.currentTarget.select(); }} onChange={(e) => setDH({ budgetTWD: parseNumberInput(e.target.value) })} />
          </div>
          <div>
            <div className="label">Floors</div>
            <input className="input" type="number" value={d.floors} onChange={(e) => setDH({ floors: Number(e.target.value) })} />
          </div>
          <div>
            <div className="label">Land size</div>
            <input className="input" type="number" value={d.landPing} onChange={(e) => setDH({ landPing: Number(e.target.value) })} />
          </div>
          <div>
            <div className="label">Indoor size</div>
            <input className="input" type="number" value={d.indoorPing} onChange={(e) => setDH({ indoorPing: Number(e.target.value) })} />
          </div>

          <div>
            <div className="label">Bedrooms</div>
            <input className="input" type="number" value={d.bedrooms} onChange={(e) => setDH({ bedrooms: Number(e.target.value) })} />
          </div>
          <div>
            <div className="label">Bathrooms</div>
            <input className="input" type="number" value={d.bathrooms} onChange={(e) => setDH({ bathrooms: Number(e.target.value) })} />
          </div>
        </div>

        <div className="hr" />

        <div className="grid2 dreamListsGrid">
          <ListEditor title="Must have" items={d.mustHaves} onChange={(next) => setDH({ mustHaves: next })} />
          <ListEditor title="Nice to have" items={d.niceToHaves} onChange={(next) => setDH({ niceToHaves: next })} />
        </div>

        <div className="hr" />

        <div className="label">Notes</div>
        <textarea className="textarea" value={d.notes} onChange={(e) => setDH({ notes: e.target.value })} placeholder="Any extra requirements…" />
      </div>

      <div className="pageActions">
        <button className="button primary exportBtn" onClick={doExport}>Export</button>
      </div>
    </div>
  );
}
