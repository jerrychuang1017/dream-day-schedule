import React, { useEffect, useMemo, useState } from "react";
import { from12h, smart12hText, to12h, toggleAmPm } from "../utils/time";

type Props = {
  value24: string;
  onChange24: (next: string) => void;
  ariaLabel?: string;
};

export default function TimeField({ value24, onChange24, ariaLabel }: Props) {
  const parsed = useMemo(() => to12h(value24), [value24]);
  const [text, setText] = useState(parsed.time);

  useEffect(() => setText(parsed.time), [parsed.time]);

  function commit(nextRaw: string) {
    const maybeText = smart12hText(nextRaw);
    const textToUse = maybeText ?? nextRaw;
    const maybe24 = from12h(textToUse, parsed.ampm);
    if (maybe24) onChange24(maybe24);
  }

  return (
    <div className="timeRow">
      <input
        className="input"
        value={text}
        aria-label={ariaLabel}
        inputMode="numeric"
        placeholder="5 / 515 / 5:15"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <div
        className="timeToggle"
        role="button"
        tabIndex={0}
        onClick={() => onChange24(toggleAmPm(value24))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onChange24(toggleAmPm(value24));
        }}
        aria-label="Toggle AM/PM"
        title="Toggle AM/PM"
      >
        {parsed.ampm}
      </div>
    </div>
  );
}
