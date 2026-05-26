export function formatNumberWithCommas(value: number | string) {
  const raw = String(value ?? "");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseNumberInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}
