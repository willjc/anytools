import type { PDFDocumentProxy } from "pdfjs-dist";

async function renderPage(
  document: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  maxDimension: number,
): Promise<void> {
  const page = await document.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxDimension / baseViewport.width, maxDimension / baseViewport.height, 2);
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建页面画布。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
}

export async function renderPdfPageToCanvas(
  sourceBytes: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // The worker takes ownership of the buffer it receives, so hand it a copy.
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) });
  try {
    const document = await loadingTask.promise;
    await renderPage(document, pageNumber, canvas, 1400);
  } finally {
    await loadingTask.destroy();
  }
}

export async function renderPdfPages(
  sourceBytes: ArrayBuffer,
  pageNumbers: number[],
  maxDimension: number,
  handlePage: (canvas: HTMLCanvasElement, pageNumber: number, index: number) => Promise<void>,
): Promise<void> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) });
  try {
    const document = await loadingTask.promise;
    for (let index = 0; index < pageNumbers.length; index += 1) {
      const pageNumber = pageNumbers[index];
      const canvas = window.document.createElement("canvas");
      await renderPage(document, pageNumber, canvas, maxDimension);
      await handlePage(canvas, pageNumber, index);
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    await loadingTask.destroy();
  }
}
