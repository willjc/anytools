"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, PartyPopper, RotateCcw, Sparkles } from "lucide-react";

import { drawWinners, formatWinnerList, LOTTERY_LIMITS, parseNames } from "@/lib/lottery";

const DRAW_COUNT_OPTIONS = [1, 2, 3, 5, 10];

function cryptoRng(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

export function LotteryWorkbench() {
  const [text, setText] = useState("");
  const [drawCount, setDrawCount] = useState(1);
  const [autoRemove, setAutoRemove] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState("");
  const [rounds, setRounds] = useState<string[][]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("粘贴名单后点击开始抽奖；默认中奖者自动移出奖池，可连续抽多轮。\n");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const names = parseNames(text);
  const pool = autoRemove ? names.filter((name) => !removed.has(name)) : names;
  const winnersAll = rounds.flat();

  function start() {
    if (rolling) return;
    if (pool.length === 0) {
      setMessage(names.length === 0 ? "请先粘贴参与名单（支持换行、逗号、顿号分隔）。\n" : "奖池已抽空，点击重置后可重新开始。\n");
      return;
    }

    const count = Math.min(drawCount, pool.length);
    setRolling(true);
    setMessage(`正在从 ${pool.length} 人中抽取 ${count} 人…`);

    const startedAt = Date.now();
    const duration = 2200;
    timerRef.current = window.setInterval(() => {
      if (Date.now() - startedAt >= duration) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const winners = drawWinners(pool, count, cryptoRng);
        setRounds((previous) => [...previous, winners].slice(-LOTTERY_LIMITS.maxWinnersHistory));
        if (autoRemove) {
          setRemoved((previous) => new Set([...previous, ...winners]));
        }
        setDisplay("");
        setRolling(false);
        setMessage(`第 ${rounds.length + 1} 轮结果：${formatWinnerList(winners)}${count < drawCount ? `（奖池不足 ${drawCount} 人）` : ""}`);
        return;
      }
      setDisplay(pool[Math.floor(Math.random() * pool.length)]);
    }, 70);
  }

  function reset() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRolling(false);
    setDisplay("");
    setRounds([]);
    setRemoved(new Set());
    setMessage("已重置，全部名单回到奖池。\n");
  }

  async function copyWinners() {
    if (winnersAll.length === 0) return;
    await navigator.clipboard.writeText(formatWinnerList(winnersAll));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section aria-label="抽奖工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <PartyPopper aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地抽奖 · 公平随机</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">抽奖 / 随机点名</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">中奖者自动移出奖池</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="lottery-names">
              参与名单
            </label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="lottery-names"
              onChange={(event) => setText(event.target.value.slice(0, 20000))}
              placeholder={"一行一个名字，也支持逗号、顿号分隔：\n张三\n李四\n王五"}
              rows={8}
              value={text}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              名单 {names.length} 人 · 奖池剩余 {pool.length} 人{winnersAll.length > 0 ? ` · 已中奖 ${winnersAll.length} 人` : ""}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">每次抽取</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DRAW_COUNT_OPTIONS.map((count) => (
                <button
                  aria-pressed={drawCount === count}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    drawCount === count ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                  }`}
                  disabled={rolling}
                  key={count}
                  onClick={() => setDrawCount(count)}
                  type="button"
                >
                  {count} 人
                </button>
              ))}
            </div>
          </fieldset>

          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
            <input
              checked={autoRemove}
              className="size-4 accent-emerald-700"
              onChange={(event) => setAutoRemove(event.target.checked)}
              type="checkbox"
            />
            中奖者自动移出奖池（连续多轮不重复）
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={rolling}
              onClick={start}
              type="button"
            >
              {rolling ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
              {rolling ? "滚动中" : rounds.length === 0 ? "开始抽奖" : "继续抽取"}
            </button>
            {rounds.length > 0 && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                disabled={rolling}
                onClick={reset}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                重置
              </button>
            )}
            {winnersAll.length > 0 && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
                onClick={() => void copyWinners()}
                type="button"
              >
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "已复制" : "复制中奖名单"}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">抽奖区</p>
          <div className="mt-2 grid min-h-44 place-items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10">
            {rolling ? (
              <p aria-live="polite" className="break-all text-center text-4xl font-bold tracking-wide text-emerald-800 sm:text-5xl">
                {display || "…"}
              </p>
            ) : rounds.length > 0 ? (
              <div className="w-full space-y-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">最新中奖</p>
                <p className="break-all text-2xl font-bold leading-snug text-slate-950 sm:text-3xl">{formatWinnerList(rounds[rounds.length - 1])}</p>
              </div>
            ) : (
              <div className="text-center">
                <PartyPopper aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">输入名单，点击「开始抽奖」</p>
              </div>
            )}
          </div>

          {rounds.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">往轮记录</p>
              <ol className="space-y-1.5">
                {rounds
                  .map((winners, index) => ({ winners, round: index + 1 }))
                  .reverse()
                  .map(({ winners, round }) => (
                    <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700" key={round}>
                      <span className="mr-2 font-mono text-xs text-slate-400">第 {round} 轮</span>
                      {formatWinnerList(winners)}
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
