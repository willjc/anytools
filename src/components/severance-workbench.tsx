"use client";

import { useMemo, useState } from "react";
import { Scale } from "lucide-react";

import { calculateSeverance, SEVERANCE_SCENARIOS, type SeveranceScenario } from "@/lib/severance";

export function SeveranceWorkbench() {
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthlyWage, setMonthlyWage] = useState("10000");
  const [socialAverageWage, setSocialAverageWage] = useState("");
  const [scenario, setScenario] = useState<SeveranceScenario>("n");

  const result = useMemo(() => {
    const wage = Number(monthlyWage);
    const social = Number(socialAverageWage);
    try {
      return calculateSeverance({
        startDate,
        endDate,
        monthlyWage: wage,
        socialAverageWage: Number.isFinite(social) && social > 0 ? social : undefined,
        scenario,
      });
    } catch {
      return null;
    }
  }, [startDate, endDate, monthlyWage, socialAverageWage, scenario]);

  const scenarioInfo = SEVERANCE_SCENARIOS.find((item) => item.id === scenario);
  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
  const label = "block text-sm font-semibold text-slate-900";

  return (
    <section aria-label="经济补偿金计算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <Scale aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地计算 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">经济补偿金计算器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">N / N+1 / 2N</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">离职情形</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SEVERANCE_SCENARIOS.map((item) => (
                <button
                  aria-pressed={scenario === item.id}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${scenario === item.id ? "border-emerald-700 bg-emerald-50" : "border-slate-300 bg-white hover:border-emerald-500"}`}
                  key={item.id}
                  onClick={() => setScenario(item.id)}
                  type="button"
                >
                  <span className={`block text-sm font-semibold ${scenario === item.id ? "text-emerald-800" : "text-slate-900"}`}>{item.name}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">{item.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="sev-start">入职日期</label><input className={field} id="sev-start" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></div>
            <div><label className={label} htmlFor="sev-end">离职日期</label><input className={field} id="sev-end" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></div>
            <div><label className={label} htmlFor="sev-wage">离职前 12 个月平均工资（元/月）</label><input className={field} id="sev-wage" inputMode="decimal" onChange={(event) => setMonthlyWage(event.target.value.replace(/[^\d.]/g, ""))} type="number" value={monthlyWage} /></div>
            <div><label className={label} htmlFor="sev-social">当地社平月工资（元，选填）</label><input className={field} id="sev-social" inputMode="decimal" onChange={(event) => setSocialAverageWage(event.target.value.replace(/[^\d.]/g, ""))} placeholder="用于三倍封顶判断" type="number" value={socialAverageWage} /></div>
          </div>
          <p className="text-xs leading-5 text-slate-500">月工资按应得工资计算（含奖金、津贴、补贴），可在工资 App 或个税记录里查年均。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">估算结果</p>
          {result ? (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{scenarioInfo?.name} · 应付总额</p>
                <p aria-live="polite" className="mt-1 text-4xl font-bold tracking-tight text-emerald-950">¥{result.total.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}</p>
                <p className="mt-1 text-sm text-emerald-800">
                  工龄 {result.years.toFixed(1)} 年 → 折算 {result.months} 个月 × {result.baseWage.toFixed(2)} 元
                </p>
              </div>
              <ul className="space-y-1.5">
                {result.notes.map((note) => (
                  <li className="flex gap-2 text-xs leading-5 text-slate-600" key={note}>
                    <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-emerald-600" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-2 grid h-40 place-items-center rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">填写日期与工资后实时估算</p>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        本计算仅为参考估算，不构成法律意见；协商离职记得书面确认补偿金额与支付时间，必要时咨询当地劳动仲裁部门或律师。
      </p>
    </section>
  );
}
