import html2canvas from "html2canvas";
import type { Theme } from "../types";

function stripChrome(root: HTMLElement) {
  root.querySelectorAll(".doneBtn").forEach((button) => {
    const replacement = document.createElement("div");
    replacement.textContent = button.textContent?.includes("✓") ? "✓" : "";
    replacement.style.font = "inherit";
    replacement.style.fontWeight = "900";
    replacement.style.color = "inherit";
    replacement.style.width = "28px";
    replacement.style.textAlign = "center";
    replacement.style.whiteSpace = "nowrap";
    button.replaceWith(replacement);
  });

  // Remove UI chrome from exports
  const removeSelectors = [
    ".header",
    ".drawer",
    ".iconBtn",
    ".navItem",
    ".pageActions",
    ".linkBtn",
    ".smallBtn",
    ".button",
  ];
  removeSelectors.forEach((sel) => root.querySelectorAll(sel).forEach((n) => n.remove()));
}

function stripActionColumns(root: HTMLElement) {
  root.querySelectorAll("table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th"));
    const actionIndex = headers.findIndex((th) => th.textContent?.trim().toLowerCase() === "action");
    if (actionIndex < 0) return;

    Array.from(table.querySelectorAll("tr")).forEach((row) => {
      const cells = Array.from(row.children);
      cells[actionIndex]?.remove();
    });
  });
}

function replaceFormControls(root: HTMLElement) {
  root.querySelectorAll("input, textarea, select").forEach((node) => {
    const control = node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const replacement = document.createElement("div");
    const value =
      control instanceof HTMLSelectElement
        ? control.options[control.selectedIndex]?.text ?? ""
        : control.value;

    replacement.textContent = value;
    replacement.style.minHeight = "22px";
    replacement.style.lineHeight = "1.45";
    replacement.style.font = "inherit";
    replacement.style.color = "inherit";
    replacement.style.whiteSpace = "pre-wrap";
    replacement.style.overflowWrap = "anywhere";
    replacement.style.padding = "2px 0";

    control.replaceWith(replacement);
  });
}

export async function exportElementToJpeg(opts: {
  el: HTMLElement | null;
  filenameBase: string;
  theme: Theme;
}) {
  const { el, filenameBase, theme } = opts;
  if (!el) return;

  // Clone into an offscreen wrapper so we can add whitespace/margins.
  const clone = el.cloneNode(true) as HTMLElement;
  stripChrome(clone);
  stripActionColumns(clone);
  replaceFormControls(clone);

  const contentWidth = Math.ceil(Math.max(el.scrollWidth, el.getBoundingClientRect().width, 1000));
  const exportWidth = contentWidth + 96;

  clone.style.width = `${contentWidth}px`;
  clone.style.maxWidth = `${contentWidth}px`;
  clone.style.boxSizing = "border-box";
  clone.style.overflow = "visible";

  const wrap = document.createElement("div");
  wrap.style.padding = "48px";
  wrap.style.background = theme === "dark" ? "#000000" : "#ffffff";
  wrap.style.boxSizing = "border-box";
  wrap.style.width = `${exportWidth}px`;
  wrap.style.overflow = "visible";

  wrap.appendChild(clone);

  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-10000px";
  sandbox.style.top = "0";
  sandbox.style.width = `${exportWidth}px`;
  sandbox.style.pointerEvents = "none";
  sandbox.style.overflow = "visible";
  sandbox.appendChild(wrap);
  document.body.appendChild(sandbox);

  const canvas = await html2canvas(wrap, {
    backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
    scale: 2,
    useCORS: true,
    width: exportWidth,
    windowWidth: exportWidth,
  });

  document.body.removeChild(sandbox);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const a = document.createElement("a");
  a.href = jpegDataUrl;
  a.download = `${filenameBase}.jpg`;
  a.click();
}
