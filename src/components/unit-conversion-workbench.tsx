"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";

import { convertUnit, unitCategories } from "@/lib/unit-conversion";

function formatResult(value: number): string {
  if (Math.abs(value) >= 1e9 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(6);
  }
  const rounded = Number(value.toFixed(6));
  return String(rounded);
}

export function UnitConversionWorkbench() {
  const [categoryId, setCategoryId] = useState(unitCategories[0].id);
  const category = unitCategories.find((item) => item.id === categoryId) ?? unitCategories[0];
  const [fromUnitId, setFromUnitId] = useState(category.units[0].id);
  const [toUnitId, setToUnitId] = useState(category.units[1].id);
  const [input, setInput] = useState("1");

  function switchCategory(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    const nextCategory = unitCategories.find((item) => item.id === nextCategoryId) ?? unitCategories[0];
    setFromUnitId(nextCategory.units[0].id);
    setToUnitId(nextCategory.units[1]?.id ?? nextCategory.units[0].id);
  }

  function swap() {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  }

  const numericInput = Number(input);
  const result = input.trim() !== "" && Number.isFinite(numericInput)
    ? convertUnit(categoryId, fromUnitId, toUnitId, numericInput)
    : null;

  const fromUnit = category.units.find((unit) => unit.id === fromUnitId);
  const toUnit = category.units.find((unit) => unit.id === toUnitId);

  return (
    <section aria-label="单位换算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Ruler aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-emerald-700">输入即换算</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">单位换算</h2>
          </div>
        </div>
      </div>

      <div className="mt-7 space-y-6">
        <div className="flex flex-wrap gap-2">
          {unitCategories.map((item) => (
            <button className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${item.id === categoryId ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700"}`} key={item.id} onClick={() => switchCategory(item.id)} type="button">{item.label}</button>
          ))}
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="unit-from">从</label>
            <input className="mt-1 w-full border-0 text-2xl font-semibold text-slate-900 outline-none" id="unit-from" onChange={(event) => setInput(event.target.value)} type="text" value={input} />
            <select aria-label="源单位" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-600" onChange={(event) => setFromUnitId(event.target.value)} value={fromUnitId}>
              {category.units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.label}</option>
              ))}
            </select>
          </div>

          <button aria-label="交换单位" className="mx-auto rounded-full border border-slate-300 p-3 text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700" onClick={swap} type="button">⇄</button>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">结果</p>
            <p className="mt-1 break-all text-2xl font-semibold text-emerald-900">{result === null ? "—" : formatResult(result)}</p>
            <select aria-label="目标单位" className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-600" onChange={(event) => setToUnitId(event.target.value)} value={toUnitId}>
              {category.units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {result === null || !fromUnit || !toUnit ? "请输入有效数字。" : `${formatResult(Number(input))} ${fromUnit.label} ≈ ${formatResult(result)} ${toUnit.label}`}
        </p>
      </div>
    </section>
  );
}
