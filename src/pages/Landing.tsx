import React from "react";
import type { AppState } from "../types";

type Props = {
  state: AppState;
};

export default function Landing({ state }: Props) {
  return (
    <div className="homePage">
      <div className="card homeIntro" style={{ textAlign: "center" }}>
        <div className="h1" style={{ fontSize: 18, letterSpacing: "0.14em" }}>
          Project Dream Day
        </div>
        <div className="homeTagline">
          <div><span className="doubleStrike">Burn out</span></div>
          <div><span className="doubleStrike">Layoff</span></div>
        </div>
        <div className="hr homeDivider" />
        <div className="homeVision">
          <div className="sub homeVisionText">
            <div>A little alone time to breathe and listen to your inner voice.</div>
            <div>A reason to look forward to tomorrow.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
