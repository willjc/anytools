import { ImageCropWorkbench } from "@/components/image-crop-workbench";
import { AudioConvertWorkbench } from "@/components/audio-convert-workbench";
import { HeicToJpgWorkbench } from "@/components/heic-to-jpg-workbench";
import { ImageGridWorkbench } from "@/components/image-grid-workbench";
import { ImageStitchWorkbench } from "@/components/image-stitch-workbench";
import { IpLookupWorkbench } from "@/components/ip-lookup-workbench";
import { ImageWatermarkWorkbench } from "@/components/image-watermark-workbench";
import { ImageWorkbench } from "@/components/image-workbench";
import { DateCalculatorWorkbench } from "@/components/date-calculator-workbench";
import { MortgageWorkbench } from "@/components/mortgage-workbench";
import { PdfCompressWorkbench } from "@/components/pdf-compress-workbench";
import { PdfEditTextWorkbench } from "@/components/pdf-edit-text-workbench";
import { PdfMergeWorkbench } from "@/components/pdf-merge-workbench";
import { PdfOrganizeWorkbench } from "@/components/pdf-organize-workbench";
import { PdfPageNumbersWorkbench } from "@/components/pdf-page-numbers-workbench";
import { PdfSplitWorkbench } from "@/components/pdf-split-workbench";
import { PdfToWordWorkbench } from "@/components/pdf-to-word-workbench";
import { PdfWatermarkWorkbench } from "@/components/pdf-watermark-workbench";
import { QrCodeWorkbench } from "@/components/qr-code-workbench";
import { RmbUppercaseWorkbench } from "@/components/rmb-uppercase-workbench";
import { ToolWorkbenchPlaceholder } from "@/components/tool-workbench-placeholder";
import { UnitConversionWorkbench } from "@/components/unit-conversion-workbench";
import { VideoCompressWorkbench } from "@/components/video-compress-workbench";
import { VideoToAudioWorkbench } from "@/components/video-to-audio-workbench";
import type { ToolDefinition } from "@/lib/tools";

export function ToolWorkbench({ tool }: { tool: ToolDefinition }) {
  if (tool.availability === "comingSoon") {
    return <ToolWorkbenchPlaceholder tool={tool} />;
  }

  switch (tool.slug) {
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
    case "qr-code":
      return <QrCodeWorkbench />;
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
