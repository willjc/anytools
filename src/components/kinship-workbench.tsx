"use client";

import { useMemo, useState } from "react";
import { Delete, RotateCcw, Users } from "lucide-react";

import {
  appendChainToken,
  KINSHIP_TOKENS,
  kinshipChainFromTerm,
  kinshipFromChain,
  removeLastToken,
  type KinshipSex,
} from "@/lib/kinship";

type Mode = "chain" | "explain";

export function KinshipWorkbench() {
  const [mode, setMode] = useState<Mode>("chain");
  const [sex, setSex] = useState<KinshipSex>("male");
  const [chain, setChain] = useState("");
  const [term, setTerm] = useState("");

  const chainTerms = useMemo(() => kinshipFromChain(chain, sex), [chain, sex]);
  const explained = useMemo(() => {
    if (mode !== "explain" || !term.trim()) return { chains: [], forward: [] };
    const trimmed = term.trim();
    return { chains: kinshipChainFromTerm(trimmed), forward: kinshipFromChain(trimmed, sex) };
  }, [mode, term, sex]);

  return (
    <section aria-label="亲戚称呼计算工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <Users aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地计算 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">亲戚称呼计算器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">三代内直系旁系全覆盖</span>
      </div>

      <div className="mt-7 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <fieldset>
            <legend className="sr-only">选择模式</legend>
            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
              {(
                [
                  { id: "chain", label: "点选关系链" },
                  { id: "explain", label: "称呼查关系" },
                ] as const
              ).map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    mode === item.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-emerald-700"
                  }`}
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="sr-only">我的性别</legend>
            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
              {(
                [
                  { id: "male", label: "我是男生" },
                  { id: "female", label: "我是女生" },
                ] as const
              ).map((item) => (
                <button
                  aria-pressed={sex === item.id}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    sex === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                  key={item.id}
                  onClick={() => setSex(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {mode === "chain" ? (
          <div className="space-y-4">
            <div className="min-h-14 rounded-2xl bg-slate-50 px-4 py-3">
              {chain ? (
                <p className="text-lg font-semibold leading-8 text-slate-950">{chain}</p>
              ) : (
                <p className="text-sm leading-8 text-slate-400">点击下方称呼，从「我」开始一步步搭建关系，例如 爸爸 → 哥哥</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">选择关系</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {KINSHIP_TOKENS.map((token) => (
                  <button
                    className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
                    key={token}
                    onClick={() => setChain((previous) => appendChainToken(previous, token))}
                    type="button"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!chain}
                onClick={() => setChain((previous) => removeLastToken(previous))}
                type="button"
              >
                <Delete aria-hidden="true" className="size-4" />
                回退一步
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!chain}
                onClick={() => setChain("")}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                清空
              </button>
            </div>

            <div aria-live="polite" className="rounded-2xl bg-emerald-50 px-4 py-4">
              {chainTerms.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">你应称呼</p>
                  <p className="mt-1 text-3xl font-bold tracking-wide text-emerald-950">{chainTerms[0]}</p>
                  {chainTerms.length > 1 && <p className="mt-1 text-sm text-emerald-800">也叫：{chainTerms.slice(1).join("、")}</p>}
                </>
              ) : (
                <p className="text-sm leading-6 text-emerald-900">{chain ? "这层关系没有常见称呼，试试换一步。" : "选好关系链后，这里显示称呼。"}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="kinship-term">
                输入称呼或关系
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                id="kinship-term"
                onChange={(event) => setTerm(event.target.value)}
                placeholder="例如：舅公、表姑，或“爸爸的哥哥”"
                type="text"
                value={term}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">输入称呼会解释TA和你的关系；输入关系链（如“妈妈的妈妈”）会算出该怎么叫。</p>
            </div>

            <div aria-live="polite" className="rounded-2xl bg-emerald-50 px-4 py-4">
              {!term.trim() ? (
                <p className="text-sm leading-6 text-emerald-900">输入后这里显示结果。</p>
              ) : explained.chains.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">「{term.trim()}」是你的</p>
                  <ul className="mt-1 space-y-1">
                    {explained.chains.map((item, index) => (
                      <li className="text-lg font-semibold leading-8 text-emerald-950" key={`${item}-${index}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : explained.forward.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">你应称呼TA</p>
                  <p className="mt-1 text-3xl font-bold tracking-wide text-emerald-950">{explained.forward[0]}</p>
                  {explained.forward.length > 1 && <p className="mt-1 text-sm text-emerald-800">也叫：{explained.forward.slice(1).join("、")}</p>}
                </>
              ) : (
                <p className="text-sm leading-6 text-emerald-900">没算出这个称呼，试试「舅公」「表姑」这样的写法。</p>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        称呼以北方常见叫法为主，各地略有差异；计算在浏览器本地完成。
      </p>
    </section>
  );
}
