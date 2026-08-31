"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Globe, LoaderCircle, Search } from "lucide-react";

import { type GeoInfo } from "@/lib/ip-lookup";

type VisitorInfo = {
  ip: string;
  isPrivate: boolean;
  geoLine: string | null;
};

type LookupResponse = {
  ok: boolean;
  error?: string;
  kind?: "ip" | "domain";
  query?: string;
  records?: {
    a: string[];
    aaaa: string[];
    cname: string[];
    mx: { exchange: string; priority: number }[];
    ns: string[];
    txt: string[];
  };
  geo?: Record<string, GeoInfo>;
  geoLines?: Record<string, string | null>;
};

const RECORD_SECTIONS: { key: keyof NonNullable<LookupResponse["records"]>; label: string; note?: string }[] = [
  { key: "a", label: "A 记录", note: "IPv4 地址" },
  { key: "aaaa", label: "AAAA 记录", note: "IPv6 地址" },
  { key: "cname", label: "CNAME 记录", note: "别名指向" },
  { key: "mx", label: "MX 记录", note: "邮件服务器" },
  { key: "ns", label: "NS 记录", note: "域名服务器" },
  { key: "txt", label: "TXT 记录", note: "文本记录" },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button aria-label={label} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => void copy()} type="button">
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
    </button>
  );
}

export function IpLookupWorkbench() {
  const [visitor, setVisitor] = useState<VisitorInfo>();
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [result, setResult] = useState<LookupResponse>();
  const [message, setMessage] = useState("打开页面即可看到你的 IP；输入域名或 IP 可查询对方的解析与归属地。\n");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/tools/ip-lookup", { cache: "no-store" });
        const data = (await response.json()) as VisitorInfo;
        if (!cancelled) setVisitor(data);
      } catch {
        if (!cancelled) setVisitor({ ip: "", isPrivate: true, geoLine: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function lookup() {
    const trimmed = query.trim();
    if (!trimmed) {
      setMessage("请输入要查询的域名或 IP 地址。\n");
      return;
    }

    setIsQuerying(true);
    setMessage(`正在查询 ${trimmed} …`);
    try {
      const response = await fetch("/api/tools/ip-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await response.json()) as LookupResponse;
      if (!data.ok) {
        setMessage(`${data.error ?? "查询失败，请稍后重试。"}\n`);
        setResult(undefined);
        return;
      }
      setResult(data);
      setMessage(`查询完成：${data.query}（${data.kind === "ip" ? "IP 直查" : "域名解析"}）。`);
    } catch {
      setMessage("查询失败，请检查网络后重试。\n");
    } finally {
      setIsQuerying(false);
    }
  }

  const records = result?.records;

  return (
    <section aria-label="IP 查询工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d7f0ee] text-teal-800"><Globe aria-hidden="true" className="size-6" /></span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端查询 · 即时返回</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">IP 查询</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">不保存查询记录</span>
      </div>

      <div className="mt-7 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">你的 IP</p>
          {visitor === undefined ? (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> 正在获取…</p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 font-mono text-2xl font-semibold text-slate-950">
                {visitor.ip || "未知"}
                {visitor.ip && <CopyButton label="复制我的 IP" value={visitor.ip} />}
              </span>
              {visitor.isPrivate && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">内网 / 本机地址</span>}
            </div>
          )}
          {visitor?.geoLine && <p className="mt-2 text-sm leading-6 text-slate-600">{visitor.geoLine}</p>}
          <p className="mt-3 text-xs leading-5 text-slate-500">归属地数据仅供参考，精确到城市级；运营商信息来自公开 IP 库。</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900" htmlFor="ip-lookup-query">查询域名或 IP</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="ip-lookup-query"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void lookup(); }}
              placeholder="例如 www.zhihu.com 或 8.8.8.8"
              type="text"
              value={query}
            />
            <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isQuerying} onClick={() => void lookup()} type="button">
              {isQuerying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}
              {isQuerying ? "查询中" : "查询"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">支持粘贴带 https:// 的链接（自动提取域名）；也可直接输入 IP 地址查询归属地。</p>
        </div>

        {result && result.ok && records && (
          <div className="space-y-4">
            {RECORD_SECTIONS.map(({ key, label, note }) => {
              const values = records[key];
              if (!values || values.length === 0) return null;
              return (
                <div className="rounded-2xl border border-slate-200 p-4" key={key}>
                  <p className="text-sm font-semibold text-slate-900">{label} <span className="ml-1 text-xs font-normal text-slate-500">{note}</span></p>
                  <ul className="mt-2 space-y-1.5">
                    {key === "mx"
                      ? (values as { exchange: string; priority: number }[]).map((record) => (
                          <li className="flex flex-wrap items-center gap-2 text-sm text-slate-700" key={record.exchange}>
                            <span className="font-mono">{record.exchange}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">优先级 {record.priority}</span>
                            {result.geoLines?.[record.exchange] ? <span className="text-xs text-slate-500">{result.geoLines[record.exchange]}</span> : null}
                          </li>
                        ))
                      : (values as (string | string[])[]).map((value, index) => {
                          const text = Array.isArray(value) ? value.join("") : value;
                          const geoLine = result.geoLines?.[text];
                          return (
                            <li className="flex flex-wrap items-center gap-2 text-sm text-slate-700" key={`${text}-${index}`}>
                              <span className="font-mono">{text}</span>
                              {geoLine ? <span className="text-xs text-slate-500">{geoLine}</span> : null}
                              <CopyButton label={`复制 ${text}`} value={text} />
                            </li>
                          );
                        })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
