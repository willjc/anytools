import { PDFDocument } from "pdf-lib";

export type SignatureImageKind = "png" | "jpg";

export type SignaturePlacement = {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
};

export type PdfSignaturePlacement = SignaturePlacement & {
  pageIndex: number;
};

type PageSize = {
  width: number;
  height: number;
};

type PageGeometry = {
  getCropBox: () => { x: number; y: number; width: number; height: number };
  getMediaBox: () => { x: number; y: number; width: number; height: number };
  getRotation: () => { angle: number };
};

export function supportsSimpleSignaturePlacement(page: PageGeometry): boolean {
  const media = page.getMediaBox();
  const crop = page.getCropBox();
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const close = (left: number, right: number) => Math.abs(left - right) < 0.01;
  return rotation === 0
    && close(media.x, 0)
    && close(media.y, 0)
    && close(crop.x, media.x)
    && close(crop.y, media.y)
    && close(crop.width, media.width)
    && close(crop.height, media.height);
}

function assertGeometry(page: PageSize, imageAspect: number, placement: SignaturePlacement) {
  if (
    !Number.isFinite(page.width) ||
    !Number.isFinite(page.height) ||
    page.width <= 0 ||
    page.height <= 0 ||
    !Number.isFinite(imageAspect) ||
    imageAspect <= 0 ||
    !Number.isFinite(placement.xRatio) ||
    !Number.isFinite(placement.yRatio) ||
    !Number.isFinite(placement.widthRatio) ||
    placement.widthRatio <= 0
  ) {
    throw new Error("签名位置或尺寸无效。");
  }
}

export function clampSignaturePlacement(
  placement: SignaturePlacement,
  page: PageSize,
  imageAspect: number,
): SignaturePlacement {
  assertGeometry(page, imageAspect, placement);

  const maxWidthRatio = Math.min(1, (imageAspect * page.height) / page.width);
  const widthRatio = Math.min(placement.widthRatio, maxWidthRatio);
  const heightRatio = (widthRatio * page.width) / imageAspect / page.height;

  return {
    xRatio: Math.min(Math.max(placement.xRatio, 0), 1 - widthRatio),
    yRatio: Math.min(Math.max(placement.yRatio, 0), 1 - heightRatio),
    widthRatio,
  };
}

export function toPdfSignatureRect(
  placement: SignaturePlacement,
  page: PageSize,
  imageAspect: number,
): { x: number; y: number; width: number; height: number } {
  const clamped = clampSignaturePlacement(placement, page, imageAspect);
  const width = clamped.widthRatio * page.width;
  const height = width / imageAspect;

  return {
    x: clamped.xRatio * page.width,
    y: page.height - clamped.yRatio * page.height - height,
    width,
    height,
  };
}

export async function addSignatureImageToPdf(
  sourceBytes: ArrayBuffer | Uint8Array,
  imageBytes: ArrayBuffer | Uint8Array,
  imageKind: SignatureImageKind,
  placement: PdfSignaturePlacement,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(sourceBytes);
  if (!Number.isInteger(placement.pageIndex) || placement.pageIndex < 0 || placement.pageIndex >= document.getPageCount()) {
    throw new Error("目标页不存在。");
  }

  const image = imageKind === "png" ? await document.embedPng(imageBytes) : await document.embedJpg(imageBytes);
  const page = document.getPage(placement.pageIndex);
  const rect = toPdfSignatureRect(placement, page.getSize(), image.width / image.height);
  page.drawImage(image, rect);

  return document.save();
}
