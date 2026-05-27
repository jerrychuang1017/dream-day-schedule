import React, { useRef } from "react";
import type { AppState } from "../types";
import { dayKeyForToday, oneLine } from "../utils/time";
import { exportElementToJpeg } from "../utils/export";
import { formatNumberWithCommas } from "../utils/number";

type Props = { state: AppState };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card printSection allSummarySection" style={{ background: "transparent" }}>
      <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
        {title}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
</div>
  );
}

function goalText(x: { text: string; targetMonth?: string }) {
  return `${x.targetMonth ? `${x.targetMonth} · ` : ""}${oneLine(x.text) || "—"}`;
}

export default function AllSummary({ state }: Props) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const todayKey = dayKeyForToday();
  const today = state.schedules[todayKey];
  const name = state.name === "(skip)" ? "" : (state.name || "");
  const title = name ? `${name}'s Project Dream Day` : "Project Dream Day";
  const cityRankings = [...state.cities]
    .map((c) => {
      const vals = (state.cityCriteria || []).map((k) => Number(c.scores[k] ?? 0));
      const total = vals.reduce((a, b) => a + b, 0);
      const maxTotal = vals.length * 5;
      const avg = vals.length ? total / vals.length : 0;
      return {
        id: c.id,
        city: oneLine(c.city) || "—",
        total,
        maxTotal,
        avg,
        notes: oneLine(c.notes) || "—",
      };
    })
    .sort((a, b) => b.total - a.total);

  async function doExport() {
    await exportElementToJpeg({
      el: exportRef.current,
      filenameBase: (name ? `${name}_` : "") + "all_summary",
      theme: state.theme,
    });
  }

  return (
    <div className="printWrap" ref={exportRef}>
      <div className="card printSection">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="h1" style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</div>
            <div className="sub" style={{ marginTop: 6 }}>All data in one clean export page.</div>          </div>
          
        </div>
      </div>

      <div className="hr" />

      <Section title="Daily schedule">
        {today ? (
          <div className="wpWrap">
            <div className="wpCard">
              {(today.blocks || []).map((b, i) => (
                <div className="wpItem" key={i}>
                  <div className="wpTime">{b.start}–{b.end}</div>
                  <div className="wpAct">
                    {oneLine(b.activity) || "—"}
                    {oneLine(b.withWho) ? <span className="wpWith"> · {oneLine(b.withWho)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="sub">No schedule yet.</div>
        )}
      </Section>

      <Section title="People relationship">
        <table className="table">
          <thead>
            <tr><th className="th">Name</th><th className="th">Relationship</th><th className="th">Keep close?</th><th className="th">Notes</th></tr>
          </thead>
          <tbody>
            {state.people.map(p => (
              <tr key={p.id}>
                <td className="td">{oneLine(p.name) || "—"}</td>
                <td className="td">{oneLine(p.relationship) || "—"}</td>
                <td className="td">{p.positive ? "Yes" : "No"}</td>
                <td className="td">{oneLine(p.notes) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Top 10 must do">
        <table className="table">
          <colgroup>
            <col />
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="th">Must do</th>
              <th className="th" style={{ textAlign: "right" }}>Done</th>
            </tr>
          </thead>
          <tbody>
            {state.top10.map((t, i) => (
              <tr key={t.id}>
                <td className="td">#{i + 1} {oneLine(t.text) || "—"}</td>
                <td className="td" style={{ textAlign: "right" }}>{t.done ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Goals (1/3/5 years)">
        <div className="allGoalsGrid">
          <div className="allGoalBlock">
            <div className="allGoalTitle">Short 1 year</div>
            <ul className="allGoalList">{state.goals.short1y.map(x => <li key={x.id}>{goalText(x)}</li>)}</ul>
          </div>
          <div className="allGoalBlock">
            <div className="allGoalTitle">Mid 3 years</div>
            <ul className="allGoalList">{state.goals.mid3y.map(x => <li key={x.id}>{goalText(x)}</li>)}</ul>
          </div>
          <div className="allGoalBlock">
            <div className="allGoalTitle">Long 5 years</div>
            <ul className="allGoalList">{state.goals.long5y.map(x => <li key={x.id}>{goalText(x)}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section title="Favorite city">
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
            {cityRankings.map((c, i) => (
              <tr key={c.id}>
                <td className="td">{i + 1}</td>
                <td className="td">{c.city}</td>
                <td className="td">{c.total} / {c.maxTotal}</td>
                <td className="td">{c.avg.toFixed(1)}</td>
                <td className="td">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Places">
        <table className="table">
          <thead>
            <tr><th className="th">Place</th><th className="th">Frequency</th><th className="th">Vibe</th><th className="th">Want more?</th><th className="th">Notes</th></tr>
          </thead>
          <tbody>
            {state.places.map(p => (
              <tr key={p.id}>
                <td className="td">{oneLine(p.place) || "—"}</td>
                <td className="td">{Number(p.times ?? 1)} / {p.frequency}</td>
                <td className="td">{p.vibe}</td>
                <td className="td">{p.wantMore ? "Yes" : "No"}</td>
                <td className="td">{oneLine(p.notes) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Top 5 restaurants">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Restaurant</th>
              <th className="th">City</th>
              <th className="th">Must order</th>
            </tr>
          </thead>
          <tbody>
            {state.foods.map((r) => (
              <tr key={r.id}>
                <td className="td">{oneLine(r.restaurant) || "—"}</td>
                <td className="td">{oneLine(r.city) || "—"}</td>
                <td className="td">{oneLine(r.mustOrder) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Dream house">
        <table className="table">
          <tbody>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>City</td><td className="td">{state.dreamHouse.location}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Budget</td><td className="td">{formatNumberWithCommas(state.dreamHouse.budgetTWD)}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Land / Indoor</td><td className="td">{state.dreamHouse.landPing} / {state.dreamHouse.indoorPing}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Rooms</td><td className="td">{state.dreamHouse.bedrooms} bed · {state.dreamHouse.bathrooms} bath</td></tr>
          </tbody>
        </table>
        <div className="hr" />
        <div className="label">Must have</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{state.dreamHouse.mustHaves.map((x, i) => <li key={i}>{oneLine(x) || "—"}</li>)}</ul>
        <div style={{ marginTop: 10 }} className="label">Nice to have</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{state.dreamHouse.niceToHaves.map((x, i) => <li key={i}>{oneLine(x) || "—"}</li>)}</ul>
      </Section>

      <Section title="FIRE planning">
        <table className="table">
          <tbody>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>FIRE number</td><td className="td">{formatNumberWithCommas(state.finance.fireNumber)}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Current net worth</td><td className="td">{formatNumberWithCommas(state.finance.currentNetWorth)}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Monthly invest</td><td className="td">{formatNumberWithCommas(state.finance.monthlyInvest)}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Annual return %</td><td className="td">{state.finance.annualReturnPct}%</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Health & fitness">
        <table className="table">
          <tbody>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Height</td><td className="td">{state.health.height}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Weight</td><td className="td">{state.health.weight}</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Body fat</td><td className="td">{state.health.bodyFatPct}%</td></tr>
            <tr><td className="td" style={{ color: "var(--muted)", fontWeight: 900 }}>Goals</td><td className="td">{state.health.goalWeight} / {state.health.goalBodyFatPct}%</td></tr>
          </tbody>
        </table>
      </Section>
      <div className="pageActions" style={{ marginTop: 18 }}>
        <button className="button primary" onClick={doExport}>Export</button>
      </div>
    </div>
  );
}
