"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, LoaderCircle, Sparkles } from "lucide-react";

import { AI_EXPLAIN_LIMITS } from "@/lib/server/ai-explain";

type ExplainTask = "payslip" | "checkup" | "medication";

type ExplainConfig = {
  task: ExplainTask;
  inputLabel: string;
  placeholder: string;
  extraLabel?: string;
  extraPlaceholder?: string;
  disclaimer: string;
  successMessage: string;
};

const CONFIGS: Record<ExplainTask, ExplainConfig> = {
  payslip: {
    task: "payslip",
    inputLabel: "工资条内容",
    placeholder: "把工资条各栏粘贴进来，一行一项，例如：\n基本工资 8000\n绩效 2000\n社保个人部分 -850\n公积金 -960\n个税 -120\n实发 8070",
    extraLabel: "所在城市（可选，让社保估算更准）",
    extraPlaceholder: "例如：杭州",
    disclaimer: "解读由 AI 生成，仅供参考；社保公积金比例各地不同，个税以个税 App 数据为准，有疑问请先与 HR 核对。",
    successMessage: "解读完成，可以复制保存；对存疑栏目建议直接问 HR。",
  },
  checkup: {
    task: "checkup",
    inputLabel: "体检报告指标",
    placeholder: "把体检报告的指标粘贴进来，例如：\n血压 135/88 mmHg ↑\n空腹血糖 6.3 mmol/L ↑\n甘油三酯 2.6 mmol/L ↑\n尿酸 480 μmol/L ↑\n血红蛋白 130 g/L",
    extraLabel: "基本信息（可选）",
    extraPlaceholder: "例如：男，35 岁，坐办公室",
    disclaimer: "解读不构成医疗建议，仅供参考；请以医生诊断为准，异常指标建议复查或遵医嘱就医。",
    successMessage: "解读完成；请重点看『需要重视的项目』，并按建议复查。",
  },
  medication: {
    task: "medication",
    inputLabel: "药品说明书",
    placeholder: "把药品说明书内容（或拍照识别的文字）粘贴进来，包括规格、用法用量、注意事项等。",
    extraLabel: "想了解的问题（可选）",
    extraPlaceholder: "例如：老人肾功能不好能不能吃",
    disclaimer: "转述基于所提供的说明书内容，不构成用药建议；请严格遵医嘱及说明书，有疑问咨询医生或药师。",
    successMessage: "大白话版已生成；具体用药请以医生和说明书为准。",
  },
};

export function AiExplainWorkbench({ task }: { task: ExplainTask }) {
  const config = CONFIGS[task];
  const [input, setInput] = useState("");
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(`粘贴内容后点击开始，AI 会逐项解读，右上角可复制保存。\n`);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    const trimmed = input.trim();
    if (!trimmed) {
      setMessage(`请先粘贴${config.inputLabel}。\n`);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setOutput("");
    setMessage("AI 正在解读，请稍候…");
    try {
      const response = await fetch("/api/tools/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: config.task, input: trimmed.slice(0, AI_EXPLAIN_LIMITS.maxInputChars), extra: extra.trim() }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "解读失败，请稍后重试。"}\n`);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
      setMessage(`${accumulated.includes("⚠️") ? "生成中断" : config.successMessage}\n`);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage("解读失败，请检查网络后重试。\n");
      }
    } finally {
      setRunning(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setRunning(false);
    setMessage("已取消。\n");
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new Blob([output], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${config.inputLabel}解读.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

  return (
    <section aria-label="AI 解读工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <Sparkles aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">AI 云端解读 · DeepSeek 驱动</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {task === "payslip" ? "工资条解读" : task === "checkup" ? "体检报告解读" : "药品说明书大白话"}
            </h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">仅供参考 · 不作专业建议</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="ai-explain-input">{config.inputLabel}</label>
            <textarea
              className={`${field} leading-6`}
              id="ai-explain-input"
              onChange={(event) => setInput(event.target.value.slice(0, AI_EXPLAIN_LIMITS.maxInputChars))}
              placeholder={config.placeholder}
              rows={10}
              value={input}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{input.length} / {AI_EXPLAIN_LIMITS.maxInputChars} 字</p>
          </div>
          {config.extraLabel && (
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="ai-explain-extra">{config.extraLabel}</label>
              <input className={field} id="ai-explain-extra" onChange={(event) => setExtra(event.target.value)} placeholder={config.extraPlaceholder} type="text" value={extra} />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={running}
              onClick={() => void run()}
              type="button"
            >
              {running ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
              {running ? "解读中" : "开始解读"}
            </button>
            {running && (
              <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400" onClick={cancel} type="button">
                取消
              </button>
            )}
            {output && !running && (
              <>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={() => void copyOutput()} type="button">
                  {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                  {copied ? "已复制" : "复制"}
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={downloadTxt} type="button">
                  <Download aria-hidden="true" className="size-4" />
                  下载 TXT
                </button>
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">解读结果</p>
          {output ? (
            <div className="mt-2 max-h-[36rem] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">{output}</div>
          ) : (
            <div className="mt-2 grid h-64 place-items-center rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">{running ? "AI 正在输出…" : "还没有解读结果"}</p>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{config.disclaimer}</p>
    </section>
  );
}
