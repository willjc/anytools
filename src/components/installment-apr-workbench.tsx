"use client";

import { useMemo, useState } from "react";
import { Percent } from "lucide-react";

import { calculateInstallmentApr } from "@/lib/installment-apr";

function percent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function InstallmentAprWorkbench() {
  const [amount, setAmount] = useState("12000");
  const [months, setMonths] = useState("12");
  const [mode, setMode] = useState<"fee" | "payment">("fee");
  const [feeRate, setFeeRate] = useState("0.6");
  const [payment, setPayment] = useState("");

  const result = useMemo(() => {
    const principal = Number(amount);
    const monthCount = Number(months);
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(monthCount) || monthCount < 1) {
      return null;
    }
    try {
      if (mode === "fee") {
        const rate = Number(feeRate) / 100;
        if (!Number.isFinite(rate) || rate < 0) return null;
        return calculateInstallmentApr({ principal, months: monthCount, monthlyFeeRate: rate });
      }
      const pay = Number(payment);
      if (!Number.isFinite(pay) || pay <= 0) return null;
      return calculateInstallmentApr({ principal, months: monthCount, monthlyPayment: pay });
    } catch {
      return null;
    }
  }, [amount, months, mode, feeRate, payment]);

  const multiple = result && result.nominalAnnualRate && result.nominalAnnualRate > 0 ? result.effectiveAnnualRate / result.nominalAnnualRate : null;

  return (
    <section aria-label="分期利率换算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <Percent aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地计算 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">分期实际利率换算</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">月费率 ≠ 年利率</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="apr-amount">分期金额（元）</label>
              <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="apr-amount" inputMode="decimal" onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} type="number" value={amount} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="apr-months">期数（月）</label>
              <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="apr-months" inputMode="numeric" onChange={(event) => setMonths(event.target.value.replace(/[^\d]/g, ""))} type="number" value={months} />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">计费方式</legend>
            <div className="mt-2 inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
              {(
                [
                  { id: "fee", label: "按月手续费率" },
                  { id: "payment", label: "按每月还款额" },
                ] as const
              ).map((item) => (
                <button aria-pressed={mode === item.id} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === item.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-emerald-700"}`} key={item.id} onClick={() => setMode(item.id)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          {mode === "fee" ? (
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="apr-fee">每月手续费率（%）</label>
              <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="apr-fee" inputMode="decimal" onChange={(event) => setFeeRate(event.target.value.replace(/[^\d.]/g, ""))} placeholder="0.6" type="number" step="0.01" value={feeRate} />
              <p className="mt-2 text-xs leading-5 text-slate-500">信用卡 / 花呗 / 白条分期宣传的“月费率”通常就是这个数。</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="apr-payment">每月还款额（元）</label>
              <input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="apr-payment" inputMode="decimal" onChange={(event) => setPayment(event.target.value.replace(/[^\d.]/g, ""))} placeholder="1072" type="number" value={payment} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">计算结果</p>
          {result ? (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">实际年化利率（IRR）</p>
                <p aria-live="polite" className="mt-1 text-4xl font-bold tracking-tight text-emerald-950">{percent(result.effectiveAnnualRate)}</p>
                {result.nominalAnnualRate !== null && result.nominalAnnualRate > 0 && (
                  <p className="mt-1 text-sm text-emerald-800">
                    表面年利率只有 {percent(result.nominalAnnualRate)}，实际是它的 <strong>{multiple?.toFixed(1)} 倍</strong>
                  </p>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-xs text-slate-500">每月还款</dt><dd className="mt-0.5 font-semibold text-slate-950">¥{result.monthlyPayment.toFixed(2)}</dd></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-xs text-slate-500">手续费总额</dt><dd className="mt-0.5 font-semibold text-slate-950">¥{result.totalFee.toFixed(2)}</dd></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-xs text-slate-500">还款总额</dt><dd className="mt-0.5 font-semibold text-slate-950">¥{result.totalRepayment.toFixed(2)}</dd></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-xs text-slate-500">期数</dt><dd className="mt-0.5 font-semibold text-slate-950">{result.months} 期</dd></div>
              </dl>
              <p className="text-xs leading-5 text-slate-500">原理：分期本金逐月归还，手续费却按全额收取，所以真实成本接近表面数字的两倍。对比一下房贷利率就知道贵多少。</p>
            </div>
          ) : (
            <div className="mt-2 grid h-40 place-items-center rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">输入金额与费率，实时算出真实年化</p>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        计算在浏览器本地完成；结果为 IRR 口径年化利率，实际以机构合同为准。
      </p>
    </section>
  );
}
