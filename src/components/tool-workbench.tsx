import { ImageWorkbench } from "@/components/image-workbench";
import { PdfSplitWorkbench } from "@/components/pdf-split-workbench";
import { QrCodeWorkbench } from "@/components/qr-code-workbench";
import { ToolWorkbenchPlaceholder } from "@/components/tool-workbench-placeholder";
import type { ToolDefinition } from "@/lib/tools";

export function ToolWorkbench({ tool }: { tool: ToolDefinition }) {
  if (tool.availability === "comingSoon") {
    return <ToolWorkbenchPlaceholder tool={tool} />;
  }

  switch (tool.slug) {
    case "pdf-split":
      return <PdfSplitWorkbench />;
    case "image-compress":
      return <ImageWorkbench mode="compress" />;
    case "image-convert":
      return <ImageWorkbench mode="convert" />;
    case "qr-code":
      return <QrCodeWorkbench />;
    default:
      return <ToolWorkbenchPlaceholder tool={tool} />;
  }
}
