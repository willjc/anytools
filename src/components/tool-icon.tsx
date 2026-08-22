import {
  ArrowLeftRight,
  FileStack,
  ImageIcon,
  Minimize2,
  QrCode,
  type LucideIcon,
} from "lucide-react";

import type { ToolDefinition } from "@/lib/tools";

const icons: Record<ToolDefinition["icon"], LucideIcon> = {
  split: FileStack,
  image: ImageIcon,
  compress: Minimize2,
  convert: ArrowLeftRight,
  qr: QrCode,
};

export function ToolIcon({
  icon,
  className,
}: {
  icon: ToolDefinition["icon"];
  className?: string;
}) {
  const Icon = icons[icon];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}
