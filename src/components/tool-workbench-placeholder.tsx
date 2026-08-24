import { Clock3 } from "lucide-react";

import { ToolIcon } from "@/components/tool-icon";
import type { ToolDefinition } from "@/lib/tools";

export function ToolWorkbenchPlaceholder({ tool }: { tool: ToolDefinition }) {
  return (
    <section aria-label={`${tool.name}工作区`} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ToolIcon className="size-6" icon={tool.icon} />
          </span>
          <div>
            <p className="text-sm font-medium text-amber-700">功能开发中</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{tool.name}工作区</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">支持 {tool.accepts.join(" · ")}</span>
      </div>

      <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
        <p className="text-base font-semibold text-slate-900">该工具暂未开放</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {tool.name}正在开发中，开放后将通过{tool.processing === "cloud" ? "服务器端" : "浏览器本地"}完成处理。当前不能上传、处理或下载文件。
        </p>
      </div>

      <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-slate-600">
        <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" />
        开放后会在当前浏览器本地读取和生成文件；关闭页面后不会在本站保留原始文件。
      </p>
    </section>
  );
}
