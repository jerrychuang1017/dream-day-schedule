import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, StepId } from "./types";
import { applyTheme, blankState, clearAll, ensureTodaySchedule, loadState, saveState } from "./storage";

import Landing from "./pages/Landing";
import DailySchedule from "./pages/DailySchedule";
import PeopleRelationship from "./pages/PeopleRelationship";
import Top10MustDo from "./pages/Top10MustDo";
import GoalsPage from "./pages/Goals";
import FavoriteCity from "./pages/FavoriteCity";
import Places from "./pages/Places";
import Food from "./pages/Food";
import DreamHouse from "./pages/DreamHouse";
import Finance from "./pages/Finance";
import HealthFitness from "./pages/HealthFitness";
import AllSummary from "./pages/AllSummary";

type PageId =
  | "home"
  | "schedule"
  | "people"
  | "top10"
  | "goals"
  | "cities"
  | "places"
  | "food"
  | "dreamhouse"
  | "finance"
  | "health"
  | "all";

const NAV: Array<{ id: PageId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "schedule", label: "Dream Day Schedule" },
  { id: "people", label: "People relationship" },
  { id: "top10", label: "Top 10 must do" },
  { id: "goals", label: "Goals (1/3/5)" },
  { id: "cities", label: "Favorite city" },
  { id: "places", label: "Places" },
  { id: "food", label: "Top 5 restaurants" },
  { id: "dreamhouse", label: "Dream house" },
  { id: "finance", label: "FIRE" },
  { id: "health", label: "Health & fitness" },
  { id: "all", label: "All" },
];

const PAGE_KEY = "project_dream_current_page";
const PAGE_IDS = NAV.map((n) => n.id);
const FEEDBACK_EMAIL = "projectdreamdaytoday@gmail.com";

function loadCurrentPage(): PageId {
  const saved = window.localStorage.getItem(PAGE_KEY);
  return PAGE_IDS.includes(saved as PageId) ? (saved as PageId) : "home";
}

export default function App() {
  const [state, setState] = useState<AppState>(() => ensureTodaySchedule(loadState()));
  const [page, setPage] = useState<PageId>(() => loadCurrentPage());
  const [navOpen, setNavOpen] = useState(false);
  const [forceNamePrompt, setForceNamePrompt] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCopied, setFeedbackCopied] = useState(false);

const updateForStep = (step: StepId, next: AppState | ((prev: AppState) => AppState)) => {
  setState((prev) => {
    const ns: AppState = typeof next === "function" ? (next as any)(prev) : next;
    return {
      ...ns,
      updatedAt: {
        ...(ns.updatedAt ?? {}),
        [step]: new Date().toISOString(),
      },
    };
  });
};

    const contentRef = useRef<HTMLDivElement | null>(null);

  const [nameDraft, setNameDraft] = useState<string>(() =>
    state.name && state.name !== "(skip)" ? state.name : ""
  );

  useEffect(() => applyTheme(state.theme), [state.theme]);

  useEffect(() => {
    const t = window.setTimeout(() => saveState(state), 250);
    return () => window.clearTimeout(t);
  }, [state]);


useEffect(() => {
  // Always jump to top when navigating between pages
  window.localStorage.setItem(PAGE_KEY, page);
  if (contentRef.current) contentRef.current.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
}, [page]);


useEffect(() => {
  const fn = () => setPage("all");
  window.addEventListener("projectdream:goAll", fn as any);
  return () => window.removeEventListener("projectdream:goAll", fn as any);
}, []);

useEffect(() => {
  const selectZero = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement | null;
    if (input?.tagName === "INPUT" && input.type === "number" && input.value === "0") {
      window.setTimeout(() => input.select(), 0);
    }
  };
  document.addEventListener("focusin", selectZero);
  return () => document.removeEventListener("focusin", selectZero);
}, []);

  const showNameModal = useMemo(
    () => forceNamePrompt || (page !== "home" && !state.name),
    [forceNamePrompt, page, state.name]
  );
  const displayName = state.name === "(skip)" ? "" : state.name;

  function toggleTheme() {
    setState((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }

  function restart() {
    clearAll();
    const fresh = ensureTodaySchedule(blankState());
    setState({ ...fresh, name: "" });
    setPage("home");
    setNavOpen(false);
    setNameDraft("");
    setForceNamePrompt(false);
  }

  function confirmName() {
    setForceNamePrompt(false);
    setState((prev) => ({ ...prev, name: nameDraft.trim() }));
  }

  function skipName() {
    setForceNamePrompt(false);
    setState((prev) => ({ ...prev, name: "(skip)" }));
  }

  async function copyFeedbackEmail() {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setFeedbackCopied(true);
      window.setTimeout(() => setFeedbackCopied(false), 1400);
    } catch {
      setFeedbackCopied(false);
    }
  }

  
  return (
    <div className="container">
      {showNameModal && (
        <div className="modalOverlay">
          <div className="modal">
            <h2 className="modalTitle">What’s your name?</h2>

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

            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button className="button primary" onClick={confirmName}>Continue</button>
              <button className="button" onClick={skipName}>Skip</button>
            </div>
          </div>
        </div>
      )}

      {navOpen && (
        <>
          <div className="drawerOverlay" onClick={() => setNavOpen(false)} />
          <div className="drawer">
            <div className="drawerHeader">
              <button className="xBtn" onClick={() => setNavOpen(false)} aria-label="Close menu">x</button>
            </div>

            <div className="drawerList">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  className={
                    "navItem " +
                    (page === n.id ? "active " : "") +
                    (n.id === "home" || n.id === "all" ? "navItemStrong" : "")
                  }
                  onClick={() => { setPage(n.id); setNavOpen(false); }}
                >
                  {n.label}
                </button>
              ))}
            </div>

            <div className="drawerFooter">
              <button className="button" onClick={toggleTheme}>
                {state.theme === "dark" ? "Light" : "Dark"}
              </button>
              <button className="button danger" onClick={restart}>Restart</button>
            </div>
          </div>
        </>
      )}

      {feedbackOpen && (
        <div className="modalOverlay feedbackOverlay">
          <div className="modal feedbackModal">
            <button className="xBtn modalXBtn" onClick={() => setFeedbackOpen(false)} aria-label="Close feedback">x</button>
            <div className="modalSub feedbackLabel">Send feedback to</div>
            <div className="feedbackEmailRow">
              <div className="feedbackEmail">{FEEDBACK_EMAIL}</div>
              <button className="copyBtn" onClick={copyFeedbackEmail} aria-label="Copy feedback email" title="Copy email">
                {feedbackCopied ? "ok" : <span className="copyIcon" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shell">
        <div className="header">
          <div className="brand">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="iconBtn" onClick={() => { setPage("home"); setNavOpen(false); }} title="Home">
                ⌂
              </div>
              <div className="iconBtn" onClick={() => setNavOpen((v) => !v)} title="Menu">
                ≡
              </div>
            </div>
          </div>

          <div className="headerRight">
            <button
              className="iconTextBtn"
              onClick={toggleTheme}
              aria-label={state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={state.theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {state.theme === "dark" ? "○" : "●"}
            </button>
            <button
              className="iconTextBtn"
              onClick={() => setFeedbackOpen((open) => !open)}
              aria-label="Feedback email"
              title="Feedback"
            >
              <svg className="feedbackSvg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v11H9l-5 4V5Z" />
                <path d="M8 9h8" />
                <path d="M8 13h6" />
              </svg>
            </button>
            <button className="button danger" onClick={restart}>Restart</button>
          </div>
        </div>

        <div className="layout">
          <div className="nav" />
          <div className="content" ref={contentRef}>
            {page === "home" && (
              <Landing state={state} />
            )}

            {page === "schedule" && (
              <DailySchedule
                state={state}
                setState={(s) => updateForStep("schedule", s)}
              />
            )}

            {page === "people" && (
              <PeopleRelationship
                state={state}
                setState={(s) => updateForStep("people", s)}
              />
            )}

            {page === "top10" && (
              <Top10MustDo
                state={state}
                setState={(s) => updateForStep("top10", s)}
              />
            )}

            {page === "goals" && (
              <GoalsPage
                state={state}
                setState={(s) => updateForStep("goals", s)}
              />
            )}

            {page === "cities" && (
              <FavoriteCity
                state={state}
                setState={(s) => updateForStep("cities", s)}
              />
            )}

            {page === "places" && (
              <Places
                state={state}
                setState={(s) => updateForStep("places", s)}
              />
            )}

            {page === "food" && (
              <Food
                state={state}
                setState={(s) => updateForStep("food", s)}
              />
            )}

            {page === "dreamhouse" && (
              <DreamHouse
                state={state}
                setState={(s) => updateForStep("dreamhouse", s)}
              />
            )}

            {page === "finance" && (
              <Finance
                state={state}
                setState={(s) => updateForStep("finance", s)}
              />
            )}

            {page === "health" && (
              <HealthFitness
                state={state}
                setState={(s) => updateForStep("health", s)}
              />
            )}

            {page === "all" && <AllSummary state={state} />}
          </div>
        </div>
      </div>
    </div>
  );
}
