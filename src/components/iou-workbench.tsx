"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ReceiptText } from "lucide-react";

import { buildIouText, type IouDetails } from "@/lib/iou";
import { wrapText } from "@/lib/text-image";

const CANVAS_WIDTH = 1080;

function renderIou(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pad = 110;
  canvas.width = CANVAS_WIDTH;
  ctx.font = "36px 'Songti SC', 'SimSun', 'Noto Serif SC', serif";

  const measure = (value: string) => ctx.measureText(value).width;
  const paragraphs = text.split("\n");
  const lineHeight = 62;
  const lines: { value: string; kind: "title" | "body" }[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push({ value: "", kind: "body" });
      continue;
    }
    if (paragraph === "借　条") {
      lines.push({ value: paragraph, kind: "title" });
      continue;
    }
    for (const line of wrapText(paragraph, measure, CANVAS_WIDTH - pad * 2)) {
      lines.push({ value: line, kind: "body" });
    }
  }

  const height = 200 + lines.length * lineHeight + 120;
  canvas.height = height;

  const ctx2 = canvas.getContext("2d");
  if (!ctx2) return;
  ctx2.fillStyle = "#ffffff";
  ctx2.fillRect(0, 0, CANVAS_WIDTH, height);
  ctx2.strokeStyle = "#c22a20";
  ctx2.lineWidth = 4;
  ctx2.strokeRect(36, 36, CANVAS_WIDTH - 72, height - 72);
  ctx2.strokeStyle = "#e7e4df";
  ctx2.lineWidth = 2;
  ctx2.strokeRect(48, 48, CANVAS_WIDTH - 96, height - 96);

  let y = 90;
  ctx2.textBaseline = "top";
  for (const line of lines) {
    if (line.kind === "title") {
      ctx2.font = "bold 64px 'Songti SC', 'SimSun', 'Noto Serif SC', serif";
      ctx2.fillStyle = "#21201c";
      ctx2.textAlign = "center";
      ctx2.fillText(line.value, CANVAS_WIDTH / 2, y);
      ctx2.textAlign = "left";
      y += 110;
      ctx2.fillStyle = "#c22a20";
      ctx2.fillRect(CANVAS_WIDTH / 2 - 40, y, 80, 8);
      y += 60;
      ctx2.font = "36px 'Songti SC', 'SimSun', 'Noto Serif SC', serif";
      continue;
    }
    ctx2.fillStyle = "#21201c";
    ctx2.fillText(line.value, pad, y);
    y += lineHeight;
  }
}

export function IouWorkbench() {
  const [details, setDetails] = useState<IouDetails>({
    lender: "",
    borrower: "",
    amountYuan: 0,
    annualRatePercent: 0,
    loanDate: new Date().toISOString().slice(0, 10),
    repaymentDate: "",
    purpose: "",
    lenderId: "",
    borrowerId: "",
    payMethod: "银行转账",
  });
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("填写要素即可生成规范借条文本与图片；建议打印后由借款人当场手写签名并按手印。\n");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generated = useMemo(() => {
    try {
      return { text: buildIouText(details), error: null as string | null };
    } catch (cause) {
      return { text: null as string | null, error: cause instanceof Error ? cause.message : "请完善借条要素。" };
    }
  }, [details]);
  const text = generated.text;
  const error = generated.error;

  function update<K extends keyof IouDetails>(key: K, value: IouDetails[K]) {
    setDetails((previous) => ({ ...previous, [key]: value }));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && text) renderIou(canvas, text);
  }, [text]);

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !text) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "借条.png";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("借条图片已下载，打印后签名按手印即可使用。\n");
    }, "image/png");
  }

  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
  const label = "block text-sm font-semibold text-slate-900";

  return (
    <section aria-label="借条生成工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            <ReceiptText aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地生成 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">借条 / 欠条生成器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">规范要素 · 附法律提示</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="iou-lender">出借人姓名</label><input className={field} id="iou-lender" onChange={(event) => update("lender", event.target.value)} placeholder="收款的一方" type="text" value={details.lender} /></div>
            <div><label className={label} htmlFor="iou-borrower">借款人姓名</label><input className={field} id="iou-borrower" onChange={(event) => update("borrower", event.target.value)} placeholder="借钱的一方" type="text" value={details.borrower} /></div>
            <div><label className={label} htmlFor="iou-amount">借款金额（元）</label><input className={field} id="iou-amount" inputMode="decimal" onChange={(event) => update("amountYuan", Number(event.target.value.replace(/[^\d.]/g, "")) || 0)} type="number" value={details.amountYuan || ""} /></div>
            <div><label className={label} htmlFor="iou-rate">年利率（%，不填为无息）</label><input className={field} id="iou-rate" inputMode="decimal" onChange={(event) => update("annualRatePercent", Number(event.target.value.replace(/[^\d.]/g, "")) || 0)} placeholder="例如 8" type="number" value={details.annualRatePercent || ""} /></div>
            <div><label className={label} htmlFor="iou-start">借款日期</label><input className={field} id="iou-start" onChange={(event) => update("loanDate", event.target.value)} type="date" value={details.loanDate} /></div>
            <div><label className={label} htmlFor="iou-end">约定还款日期</label><input className={field} id="iou-end" onChange={(event) => update("repaymentDate", event.target.value)} type="date" value={details.repaymentDate} /></div>
            <div><label className={label} htmlFor="iou-purpose">借款用途</label><input className={field} id="iou-purpose" onChange={(event) => update("purpose", event.target.value)} placeholder="个人资金周转" type="text" value={details.purpose ?? ""} /></div>
            <div><label className={label} htmlFor="iou-pay">交付方式</label><input className={field} id="iou-pay" onChange={(event) => update("payMethod", event.target.value)} placeholder="银行转账" type="text" value={details.payMethod ?? ""} /></div>
            <div><label className={label} htmlFor="iou-lender-id">出借人身份证号（可选）</label><input className={field} id="iou-lender-id" onChange={(event) => update("lenderId", event.target.value)} type="text" value={details.lenderId ?? ""} /></div>
            <div><label className={label} htmlFor="iou-borrower-id">借款人身份证号（可选）</label><input className={field} id="iou-borrower-id" onChange={(event) => update("borrowerId", event.target.value)} type="text" value={details.borrowerId ?? ""} /></div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!text} onClick={download} type="button">
              <Download aria-hidden="true" className="size-4" />
              下载借条图片
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" disabled={!text} onClick={() => void copyText()} type="button">
              {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              {copied ? "已复制" : "复制文本"}
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">约定利率不得超过合同成立时一年期 LPR 的四倍，超出部分不受法律保护；模板仅供参考，大额借款建议咨询律师。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">借条预览</p>
          {error && <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{error}</p>}
          <div className="mt-2 max-h-[36rem] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <canvas className="h-auto w-full rounded-lg shadow-card" ref={canvasRef} />
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
