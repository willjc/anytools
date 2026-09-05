import {
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  Clapperboard,
  Combine,
  Crop,
  Droplets,
  Eraser,
  FileStack,
  FileType,
  Globe,
  Hash,
  Home,
  ImageIcon,
  Layers,
  LayoutGrid,
  ListOrdered,
  Lock,
  Minimize2,
  Music,
  PenLine,
  Presentation,
  QrCode,
  Ruler,
  ScanText,
  Stamp,
  Video,
  type LucideIcon,
} from "lucide-react";

import type { ToolDefinition } from "@/lib/tools";

const icons: Record<ToolDefinition["icon"], LucideIcon> = {
  split: FileStack,
  image: ImageIcon,
  compress: Minimize2,
  convert: ArrowLeftRight,
  qr: QrCode,
  merge: Combine,
  organize: ListOrdered,
  stamp: Stamp,
  hash: Hash,
  pen: PenLine,
  fileWord: FileType,
  crop: Crop,
  droplets: Droplets,
  layers: Layers,
  grid: LayoutGrid,
  eraser: Eraser,
  video: Video,
  music: Music,
  ruler: Ruler,
  calendar: CalendarDays,
  banknote: Banknote,
  home: Home,
  globe: Globe,
  presentation: Presentation,
  lock: Lock,
  scanText: ScanText,
  clapper: Clapperboard,
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
