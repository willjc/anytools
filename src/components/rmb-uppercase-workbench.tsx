"use client";

import { useState } from "react";
import { Banknote, Check, Copy } from "lucide-react";

import { toRmbUppercase } from "@/lib/rmb-uppercase";

export function RmbUppercaseWorkbench() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const numeric = Number(input.replace(/[,，\s]/g, ""));
  const result = input.trim() !== "" && Number.isFinite(numeric) ? toRmbUppercase(numeric) : null;

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section aria-label="人民币大写工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Banknote aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">本地转换</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">人民币大写</h2>
          </div>
        </div>
      </div>

      <div className="mt-7 space-y-5">
        <label className="block text-sm font-semibold text-slate-900" htmlFor="rmb-input">数字金额（元）</label>
        <input className="w-full rounded-xl border border-slate-300 px-3 py-3 text-lg font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="rmb-input" onChange={(event) => { setInput(event.target.value); setCopied(false); }} placeholder="例如 123456.78" type="text" value={input} />

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">大写金额</p>
          {result ? (
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="break-all text-xl font-semibold leading-8 tracking-wide text-emerald-950">{result}</p>
              <button aria-label="复制结果" className="shrink-0 rounded-lg border border-emerald-300 bg-white p-2 text-emerald-700 transition hover:bg-emerald-100" onClick={() => void copyResult()} type="button">
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-emerald-900/70">{input.trim() === "" ? "输入金额后自动转换。" : "请输入有效的金额数字。"}</p>
          )}
        </div>
        <p className="text-xs leading-5 text-slate-500">支持到万亿位；四舍五入到分。转换在浏览器本地完成。</p>
      </div>
    </section>
  );
}
