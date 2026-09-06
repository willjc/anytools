"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, Copy, Plus, Trash2 } from "lucide-react";

import { formatCents, settleAa, type AaEntry } from "@/lib/aa-settle";

type Row = { id: number; name: string; paid: string };

let rowId = 3;

export function AaSettleWorkbench() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "张三", paid: "300" },
    { id: 2, name: "李四", paid: "0" },
  ]);

  const entries: AaEntry[] = useMemo(
    () =>
      rows
        .filter((row) => row.name.trim())
        .map((row) => ({ name: row.name.trim(), paidYuan: Number(row.paid.replace(/[^\d.]/g, "")) || 0 })),
    [rows],
  );

  const settlement = useMemo(() => settleAa(entries), [entries]);
  const [copied, setCopied] = useState(false);

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function copyResult() {
    const lines = settlement.transfers.map((transfer) => `${transfer.from} → ${transfer.to}：¥${formatCents(transfer.cents)}`);
    await navigator.clipboard.writeText(`AA 结算（人均 ¥${formatCents(settlement.shareCents)}）：\n${lines.join("\n")}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

  return (
    <section aria-label="聚会AA结算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <Calculator aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地计算 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">聚会 AA 结算器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">最少转账次数结清</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <span className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">姓名</span>
            <span className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">垫付金额（元）</span>
            <span className="w-9" />
          </div>
          {rows.map((row) => (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={row.id}>
              <input aria-label="姓名" className={field} onChange={(event) => updateRow(row.id, { name: event.target.value })} placeholder="姓名" type="text" value={row.name} />
              <input aria-label={`${row.name || "此人"}垫付金额`} className={field} inputMode="decimal" onChange={(event) => updateRow(row.id, { paid: event.target.value.replace(/[^\d.]/g, "") })} placeholder="0" type="number" value={row.paid} />
              <button aria-label="删除此人" className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:text-red-600" disabled={rows.length <= 2} onClick={() => setRows((previous) => previous.filter((item) => item.id !== row.id))} type="button">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700"
            onClick={() => {
              rowId += 1;
              setRows((previous) => [...previous, { id: rowId, name: "", paid: "0" }]);
            }}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            添加一人
          </button>
          <p className="text-xs leading-5 text-slate-500">垫付为 0 表示此人没付钱；总额按人数平均分摊，尾差自动落到分。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">结算方案</p>
          {settlement.transfers.length > 0 ? (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                总消费 ¥{formatCents(settlement.totalCents)} · 人均 <strong>¥{formatCents(settlement.shareCents)}</strong> · 只需 {settlement.transfers.length} 笔转账
              </div>
              <ul className="space-y-2">
                {settlement.transfers.map((transfer, index) => (
                  <li className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm" key={`${transfer.from}-${transfer.to}`}>
                    <span className="text-slate-700"><strong className="text-slate-950">{transfer.from}</strong> 转给 <strong className="text-slate-950">{transfer.to}</strong></span>
                    <span className="font-mono font-semibold text-emerald-700">¥{formatCents(transfer.cents)}</span>
                    <span aria-hidden="true" className="sr-only">{index + 1}</span>
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={() => void copyResult()} type="button">
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "已复制" : "复制结算方案发群里"}
              </button>
            </div>
          ) : (
            <div className="mt-2 grid h-40 place-items-center rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">{entries.length > 0 ? "当前没有需要转账的欠款" : "填写每人垫付的金额，自动算出谁转谁"}</p>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        金额只在浏览器本地计算，适合聚会、旅游、合租分摊。
      </p>
    </section>
  );
}
