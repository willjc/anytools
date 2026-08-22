import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ToolIcon } from "@/components/tool-icon";
import type { ToolDefinition } from "@/lib/tools";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      className="group relative flex min-h-52 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_45px_rgba(16,185,129,0.13)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
      href={`/tools/${tool.slug}`}
    >
      <div className="mb-7 flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
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
        {tool.availability === "ready" ? "浏览器本地处理" : "即将上线"}
      </span>
    </Link>
  );
}
