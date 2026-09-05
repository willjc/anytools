import { ImageCropWorkbench } from "@/components/image-crop-workbench";
import { AiPptWorkbench } from "@/components/ai-ppt-workbench";
import { GifWorkbench } from "@/components/gif-workbench";
import { ImageToTextWorkbench } from "@/components/image-to-text-workbench";
import { PdfProtectWorkbench } from "@/components/pdf-protect-workbench";
import { AudioConvertWorkbench } from "@/components/audio-convert-workbench";
import { HeicToJpgWorkbench } from "@/components/heic-to-jpg-workbench";
import { ImageGridWorkbench } from "@/components/image-grid-workbench";
import { ImageRedactWorkbench } from "@/components/image-redact-workbench";
import { ImageResizeWorkbench } from "@/components/image-resize-workbench";
import { ImageStitchWorkbench } from "@/components/image-stitch-workbench";
import { ImageToPdfWorkbench } from "@/components/image-to-pdf-workbench";
import { IpLookupWorkbench } from "@/components/ip-lookup-workbench";
import { ImageWatermarkWorkbench } from "@/components/image-watermark-workbench";
import { ImageWorkbench } from "@/components/image-workbench";
import { DateCalculatorWorkbench } from "@/components/date-calculator-workbench";
import { DocumentToMarkdownWorkbench } from "@/components/document-to-markdown-workbench";
import { MarkdownExportWorkbench } from "@/components/markdown-export-workbench";
import { MortgageWorkbench } from "@/components/mortgage-workbench";
import { PdfCompressWorkbench } from "@/components/pdf-compress-workbench";
import { PdfEditTextWorkbench } from "@/components/pdf-edit-text-workbench";
import { PdfMergeWorkbench } from "@/components/pdf-merge-workbench";
import { PdfOrganizeWorkbench } from "@/components/pdf-organize-workbench";
import { PdfPageNumbersWorkbench } from "@/components/pdf-page-numbers-workbench";
import { PdfSignatureWorkbench } from "@/components/pdf-signature-workbench";
import { PdfSplitWorkbench } from "@/components/pdf-split-workbench";
import { PdfToImageWorkbench } from "@/components/pdf-to-image-workbench";
import { PdfToWordWorkbench } from "@/components/pdf-to-word-workbench";
import { PdfWatermarkWorkbench } from "@/components/pdf-watermark-workbench";
import { QrCodeWorkbench } from "@/components/qr-code-workbench";
import { RmbUppercaseWorkbench } from "@/components/rmb-uppercase-workbench";
import { ToolWorkbenchPlaceholder } from "@/components/tool-workbench-placeholder";
import { TextCleanerWorkbench } from "@/components/text-cleaner-workbench";
import { UnitConversionWorkbench } from "@/components/unit-conversion-workbench";
import { VideoCompressWorkbench } from "@/components/video-compress-workbench";
import { VideoToAudioWorkbench } from "@/components/video-to-audio-workbench";
import { WordToPdfWorkbench } from "@/components/word-to-pdf-workbench";
import type { ToolDefinition } from "@/lib/tools";

export function ToolWorkbench({ tool }: { tool: ToolDefinition }) {
  if (tool.availability === "comingSoon") {
    return <ToolWorkbenchPlaceholder tool={tool} />;
  }

  switch (tool.slug) {
    case "ai-ppt":
      return <AiPptWorkbench />;
    case "pdf-protect":
      return <PdfProtectWorkbench />;
    case "image-to-text":
      return <ImageToTextWorkbench />;
    case "video-to-gif":
      return <GifWorkbench mode="convert" />;
    case "gif-compress":
      return <GifWorkbench mode="compress" />;
    case "pdf-split":
      return <PdfSplitWorkbench />;
    case "pdf-merge":
      return <PdfMergeWorkbench />;
    case "pdf-organize":
      return <PdfOrganizeWorkbench />;
    case "pdf-watermark":
      return <PdfWatermarkWorkbench />;
    case "pdf-page-numbers":
      return <PdfPageNumbersWorkbench />;
    case "pdf-edit-text":
      return <PdfEditTextWorkbench />;
    case "pdf-to-word":
      return <PdfToWordWorkbench />;
    case "pdf-compress":
      return <PdfCompressWorkbench />;
    case "pdf-to-image":
      return <PdfToImageWorkbench />;
    case "image-to-pdf":
      return <ImageToPdfWorkbench />;
    case "word-to-pdf":
      return <WordToPdfWorkbench />;
    case "pdf-signature":
      return <PdfSignatureWorkbench />;
    case "image-compress":
      return <ImageWorkbench mode="compress" />;
    case "image-convert":
      return <ImageWorkbench mode="convert" />;
    case "image-crop":
      return <ImageCropWorkbench />;
    case "heic-to-jpg":
      return <HeicToJpgWorkbench />;
    case "video-compress":
      return <VideoCompressWorkbench />;
    case "video-to-audio":
      return <VideoToAudioWorkbench />;
    case "audio-convert":
      return <AudioConvertWorkbench />;
    case "image-watermark":
      return <ImageWatermarkWorkbench />;
    case "image-stitch":
      return <ImageStitchWorkbench />;
    case "image-grid":
      return <ImageGridWorkbench />;
    case "image-resize":
      return <ImageResizeWorkbench />;
    case "image-redact":
      return <ImageRedactWorkbench />;
    case "qr-code":
      return <QrCodeWorkbench />;
    case "markdown-export":
      return <MarkdownExportWorkbench />;
    case "document-to-markdown":
      return <DocumentToMarkdownWorkbench />;
    case "text-cleaner":
      return <TextCleanerWorkbench />;
    case "unit-conversion":
      return <UnitConversionWorkbench />;
    case "date-calculator":
      return <DateCalculatorWorkbench />;
    case "rmb-uppercase":
      return <RmbUppercaseWorkbench />;
    case "mortgage-calculator":
      return <MortgageWorkbench />;
    case "ip-lookup":
      return <IpLookupWorkbench />;
    default:
      return <ToolWorkbenchPlaceholder tool={tool} />;
  }
}
