export const QR_HISTORY_KEY = "alltools:qr-history:v1";
export const QR_HISTORY_LIMIT = 12;

export type QrHistoryEntry = {
  content: string;
  dataUrl: string;
  createdAt: number;
};

export function parseQrHistory(value: string | null): QrHistoryEntry[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is QrHistoryEntry => (
        typeof entry === "object"
        && entry !== null
        && typeof entry.content === "string"
        && entry.content.length > 0
        && typeof entry.dataUrl === "string"
        && entry.dataUrl.startsWith("data:image/png;base64,")
        && typeof entry.createdAt === "number"
        && Number.isFinite(entry.createdAt)
      ))
      .slice(0, QR_HISTORY_LIMIT);
  } catch {
    return [];
  }
}
