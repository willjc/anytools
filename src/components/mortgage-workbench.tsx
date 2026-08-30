"use client";

import { useState } from "react";
import { Home } from "lucide-react";

import { equalPaymentSummary, equalPrincipalSummary } from "@/lib/mortgage";

function formatMoney(value: number): string {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function MortgageWorkbench() {
  const [principalWan, setPrincipalWan] = useState("100");
  const [years, setYears] = useState("30");
  const [ratePercent, setRatePercent] = useState("3.6");
  const [error, setError] = useState("");
  const [equalPayment, setEqualPayment] = useState<ReturnType<typeof equalPaymentSummary>>();
  const [equalPrincipal, setEqualPrincipal] = useState<ReturnType<typeof equalPrincipalSummary>>();

  function calculate() {
    const principal = Number(principalWan) * 10_000;
    const months = Math.round(Number(years) * 12);
    const annualRate = Number(ratePercent) / 100;

    try {
      setEqualPayment(equalPaymentSummary({ principal, annualRate, months }));
      setEqualPrincipal(equalPrincipalSummary({ principal, annualRate, months }));
      setError("");
    } catch (caughtError) {
      setEqualPayment(undefined);
      setEqualPrincipal(undefined);
      setError(caughtError instanceof Error ? caughtError.message : "输入有误，请检查。");
    }
  }

  return (
    <section aria-label="房贷计算器工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Home aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">本地计算</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">房贷计算器</h2>
          </div>
        </div>
      </div>

      <div className="mt-7 space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-900">贷款金额（万元）
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setPrincipalWan(event.target.value)} type="number" value={principalWan} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">贷款年限
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" max="50" min="1" onChange={(event) => setYears(event.target.value)} type="number" value={years} />
          </label>
          <label className="block text-sm font-semibold text-slate-900">年利率（%）
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setRatePercent(event.target.value)} step="0.01" type="number" value={ratePercent} />
          </label>
        </div>

        <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800" onClick={calculate} type="button">计算两种还款方式</button>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</p>}

        {equalPayment && equalPrincipal && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">等额本息</p>
              <p className="mt-3 text-xs text-slate-500">每月还款固定</p>
              <p className="text-2xl font-bold text-emerald-800">{formatMoney(equalPayment.monthlyPayment)} <span className="text-sm font-medium text-slate-500">元/月</span></p>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><dt>利息总额</dt><dd className="font-medium text-slate-900">{formatMoney(equalPayment.totalInterest)} 元</dd></div>
                <div className="flex justify-between"><dt>还款总额</dt><dd className="font-medium text-slate-900">{formatMoney(equalPayment.totalPayment)} 元</dd></div>
              </dl>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">等额本金</p>
              <p className="mt-3 text-xs text-slate-500">逐月递减</p>
              <p className="text-2xl font-bold text-emerald-800">{formatMoney(equalPrincipal.firstPayment)} <span className="text-sm font-medium text-slate-500">元/首月</span></p>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><dt>末月月供</dt><dd className="font-medium text-slate-900">{formatMoney(equalPrincipal.lastPayment)} 元</dd></div>
                <div className="flex justify-between"><dt>每月固定还本金</dt><dd className="font-medium text-slate-900">{formatMoney(equalPrincipal.principalPerMonth)} 元</dd></div>
                <div className="flex justify-between"><dt>利息总额</dt><dd className="font-medium text-slate-900">{formatMoney(equalPrincipal.totalInterest)} 元</dd></div>
              </dl>
            </div>
          </div>
        )}
        <p className="text-xs leading-5 text-slate-500">计算结果仅供参考，实际以贷款银行核算为准。</p>
      </div>
    </section>
  );
}
