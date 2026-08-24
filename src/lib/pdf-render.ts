export async function renderPdfPageToCanvas(
  sourceBytes: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // The worker takes ownership of the buffer it receives, so hand it a copy.
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) });
  const document = await loadingTask.promise;
  try {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxDimension = 1400;
    const scale = Math.min(maxDimension / baseViewport.width, maxDimension / baseViewport.height, 2);
    const viewport = page.getViewport({ scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("无法创建页面画布。");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
  } finally {
    await loadingTask.destroy();
  }
}
