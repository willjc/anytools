"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { addDays, diffInDays } from "@/lib/date-calculator";

export function DateCalculatorWorkbench() {
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<"diff" | "offset">("diff");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [offsetDays, setOffsetDays] = useState("30");
  const [result, setResult] = useState("");

  function calculate() {
    if (mode === "diff") {
      const diff = diffInDays(fromDate, toDate);
      if (diff === null) {
        setResult("日期格式无效，请检查后重试。");
        return;
      }
      const absDiff = Math.abs(diff);
      setResult(absDiff === 0 ? "两个是同一天。" : `相差 ${absDiff} 天（${diff > 0 ? "后者更晚" : "前者更晚"}）。`);
      return;
    }

    const days = Number(offsetDays);
    const offset = addDays(fromDate, days);
    if (offset === null) {
      setResult("日期或天数无效，请检查后重试。");
      return;
    }
    setResult(`${fromDate} ${days >= 0 ? "+" : "-"} ${Math.abs(days)} 天 = ${offset}`);
  }

  return (
    <section aria-label="日期计算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarDays aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">本地计算</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">日期计算</h2>
          </div>
        </div>
        <div className="flex gap-2">
          {[["diff", "算间隔"], ["offset", "推算日期"]].map(([value, label]) => (
            <button className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${mode === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500"}`} key={value} onClick={() => { setMode(value as typeof mode); setResult(""); }} type="button">{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-7 space-y-5">
        {mode === "diff" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-900">开始日期
              <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} />
            </label>
            <label className="block text-sm font-semibold text-slate-900">结束日期
              <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-900">起始日期
              <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} />
            </label>
            <label className="block text-sm font-semibold text-slate-900">天数（负数表示往前）
              <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setOffsetDays(event.target.value)} type="number" value={offsetDays} />
            </label>
          </div>
        )}

        <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800" onClick={calculate} type="button">计算</button>
        {result && <p aria-live="polite" className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-medium leading-7 text-emerald-950">{result}</p>}
      </div>
    </section>
  );
}
