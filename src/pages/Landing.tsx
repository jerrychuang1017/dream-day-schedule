import React from "react";
import type { AppState } from "../types";

type Props = {
  state: AppState;
};

function getStartedCount() {
  const countKey = "project_dream_started_count";
  const countedKey = "project_dream_started_counted";
  if (!window.localStorage.getItem(countedKey)) {
    const next = Number(window.localStorage.getItem(countKey) || "0") + 1;
    window.localStorage.setItem(countKey, String(next));
    window.localStorage.setItem(countedKey, "true");
    return next;
  }
  return Number(window.localStorage.getItem(countKey) || "1");
}

export default function Landing({ state }: Props) {
  const startedCount = getStartedCount();
  return (
    <div className="homePage">
      <div className="card homeIntro" style={{ textAlign: "center" }}>
        <div className="h1" style={{ fontSize: 18, letterSpacing: "0.14em" }}>
          Project Dream Day
        </div>
        <div className="homeTagline">
          <div><s>Burn out</s></div>
          <div><s>Layoff</s></div>
        </div>
        <div className="hr homeDivider" />
        <div className="homeVision">
          <div className="sub homeVisionText">
            <div>A little alone time to breathe and listen to your inner voice.</div>
            <div>A reason to look forward to tomorrow.</div>
          </div>
        </div>
      </div>
      <div className="homeStartedCount" title="Started">
        <span>{startedCount} started</span>
      </div>
    </div>
  );
}
