"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarHeart, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { classifyDate, predictPeriod } from "@/lib/period";

type PeriodEntry = { start: string };

const STORAGE_KEY = "alltools-period-records";
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // 周一为第一列
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MARK_STYLES: Record<string, string> = {
  period: "bg-emerald-700 text-white font-semibold",
  predicted: "border-2 border-dashed border-emerald-600 text-emerald-700",
  ovulation: "bg-amber-500 text-white font-semibold",
  fertile: "bg-amber-100 text-amber-800",
  none: "text-slate-700",
};

export function PeriodWorkbench() {
  const [records, setRecords] = useState<PeriodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setRecords(JSON.parse(raw) as PeriodEntry[]);
      } catch {
        // 本地数据损坏时忽略
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, loaded]);

  const prediction = useMemo(() => predictPeriod(records), [records]);
  const cells = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const today = new Date().toISOString().slice(0, 10);

  function addRecord() {
    if (!newDate || records.some((item) => item.start === newDate)) return;
    setRecords((previous) => [...previous, { start: newDate }]);
  }

  function removeRecord(start: string) {
    setRecords((previous) => previous.filter((item) => item.start !== start));
  }

  function shiftMonth(delta: number) {
    setCursor((previous) => {
      const next = new Date(Date.UTC(previous.year, previous.month - 1 + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    });
  }

  return (
    <section aria-label="经期记录工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <CalendarHeart aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">数据只存在本机浏览器 · 永不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">经期 / 安全期记录</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">隐私数据不出设备</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="period-date">记录一次经期开始日</label>
            <div className="mt-2 flex gap-2">
              <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" id="period-date" onChange={(event) => setNewDate(event.target.value)} type="date" value={newDate} />
              <button className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800" onClick={addRecord} type="button">
                <Plus aria-hidden="true" className="size-4" />
                添加
              </button>
            </div>
          </div>

          {records.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">历史记录</p>
              {[...records].sort((a, b) => b.start.localeCompare(a.start)).map((item) => (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm" key={item.start}>
                  <span className="text-slate-700">{item.start}</span>
                  <button aria-label={`删除 ${item.start}`} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-red-700" onClick={() => removeRecord(item.start)} type="button">
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">还没有记录。添加两三次后，周期预测会越来越准。</p>
          )}

          {prediction && (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-950" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">预测</p>
              <p className="mt-1">下次经期：<strong>{prediction.nextStart}</strong> 前后（平均周期 {prediction.stats.averageCycleDays} 天，{prediction.stats.regular ? "周期规律" : "周期波动较大，预测仅供参考"}）</p>
              <p>排卵日：约 {prediction.ovulationDate} · 易孕期：{prediction.fertileStart} ~ {prediction.fertileEnd}</p>
            </div>
          )}
          <p className="text-xs leading-5 text-slate-500">日历法受情绪、作息、疾病影响较大，不可作为避孕依据；月经持续异常请就医。清除浏览器数据会同时清空记录。</p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">日历</p>
            <div className="flex items-center gap-1">
              <button aria-label="上个月" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100" onClick={() => shiftMonth(-1)} type="button"><ChevronLeft aria-hidden="true" className="size-4" /></button>
              <span className="min-w-24 text-center text-sm font-semibold text-slate-900">{cursor.year} 年 {cursor.month} 月</span>
              <button aria-label="下个月" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100" onClick={() => shiftMonth(1)} type="button"><ChevronRight aria-hidden="true" className="size-4" /></button>
            </div>
          </div>
          <div className="mt-2 rounded-2xl border border-slate-200 p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />;
                const kind = loaded ? classifyDate(date, records) : "none";
                const dayNumber = Number(date.slice(8, 10));
                const isToday = date === today;
                return (
                  <span
                    className={`grid aspect-square place-items-center rounded-lg text-sm ${MARK_STYLES[kind]} ${isToday ? "ring-2 ring-emerald-400" : ""}`}
                    key={date}
                    title={kind === "none" ? undefined : { period: "经期（记录）", predicted: "预测经期", ovulation: "排卵日", fertile: "易孕期", none: "" }[kind]}
                  >
                    {dayNumber}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="size-2.5 rounded bg-emerald-700" />经期（记录）</span>
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="size-2.5 rounded border-2 border-dashed border-emerald-600" />预测经期</span>
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="size-2.5 rounded bg-amber-500" />排卵日</span>
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="size-2.5 rounded bg-amber-100" />易孕期</span>
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {loaded ? `已记录 ${records.length} 次经期，全部数据保存在本机浏览器 localStorage，网站服务器不存储任何数据。` : "正在读取本机记录…"}
      </p>
    </section>
  );
}
