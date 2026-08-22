export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "未知大小";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getDownloadFileName(fileName: string, suffix: string, extension: string): string {
  const normalizedExtension = extension.replace(/^\./, "");
  const normalizedName = fileName.trim() || "file";
  const lastDot = normalizedName.lastIndexOf(".");
  const baseName = lastDot > 0 ? normalizedName.slice(0, lastDot) : normalizedName;

  return `${baseName}${suffix}.${normalizedExtension}`;
}

export function triggerDownload(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}
