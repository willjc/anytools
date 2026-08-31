import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ToolIcon } from "@/components/tool-icon";
import type { ToolCategory, ToolDefinition } from "@/lib/tools";

/* 分类色板:Notion 式淡彩,见 DESIGN.md「分类色板」 */
const categoryTints: Record<ToolCategory, string> = {
  pdf: "bg-[#d9f3e1] text-emerald-800 group-hover:bg-emerald-600",
  image: "bg-[#dcecfa] text-sky-800 group-hover:bg-sky-600",
  create: "bg-[#fef7d6] text-amber-800 group-hover:bg-amber-500",
  av: "bg-[#e6e0f5] text-violet-800 group-hover:bg-violet-600",
  life: "bg-[#ffe8d4] text-orange-800 group-hover:bg-orange-600",
  network: "bg-[#d7f0ee] text-teal-800 group-hover:bg-teal-600",
};

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const tint = categoryTints[tool.category];

  return (
    <Link
      className="group relative flex min-h-52 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
      href={`/tools/${tool.slug}`}
    >
      <div className="mb-7 flex items-start justify-between">
        <span className={`grid size-12 place-items-center rounded-2xl transition group-hover:text-white ${tint}`}>
          <ToolIcon className="size-6" icon={tool.icon} />
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-700"
        />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{tool.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
      <span className={`mt-auto pt-5 text-sm font-medium ${tool.availability === "ready" ? "text-emerald-700" : "text-amber-700"}`}>
        {tool.availability === "comingSoon"
          ? "即将上线"
          : tool.cardTag ?? (tool.processing === "cloud" ? "云端处理 · 即时删除" : "浏览器本地处理")}
      </span>
    </Link>
  );
}
