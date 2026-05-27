import React from "react";
import type { AppState } from "../types";

type Props = {
  state: AppState;
  onStart: () => void;
};

export default function Landing({ state, onStart }: Props) {
  return (
    <div className="homePage">
      <div className="card homeIntro" style={{ textAlign: "center" }}>
        <div className="h1" style={{ fontSize: 18, letterSpacing: "0.14em" }}>
          Project Dream Day
        </div>
        <div className="homeTagline">
          <div><span className="doubleStrike">Burnout</span></div>
          <div><span className="doubleStrike">Layoffs</span></div>
        </div>
        <div className="hr homeDivider" />
        <div className="homeVision">
          <div className="sub homeVisionText">
            <div>A pause from the noise.</div>
            <div>A reason to look forward to tomorrow.</div>
          </div>
          <button className="homeCta" onClick={onStart} aria-label="Go to Dream Day Schedule">
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}
