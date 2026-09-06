"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, FileEdit, LoaderCircle, Sparkles } from "lucide-react";

const FIELD = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

const TONES = [
  { id: "restrained", label: "克制礼貌" },
  { id: "formal", label: "正式规范" },
  { id: "firm", label: "坚决明确" },
] as const;

export function LetterWorkbench() {
  const [kind, setKind] = useState<"resign" | "complaint">("resign");
  const [recipient, setRecipient] = useState("");
  const [writer, setWriter] = useState("");
  const [facts, setFacts] = useState("");
  const [demands, setDemands] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("restrained");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("把事情经过写清楚，AI 会替你组织成得体的正式文书；输出可直接复制使用。\n");
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!facts.trim()) {
      setMessage("请先写清事实经过，越具体越好（时间、金额、沟通记录等）。\n");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setOutput("");
    setMessage("AI 正在起草，请稍候…");
    try {
      const response = await fetch("/api/tools/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "letter", kind, recipient: recipient.trim(), writer: writer.trim(), facts: facts.trim().slice(0, 6000), demands: demands.trim(), tone }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(`${data?.error ?? "起草失败，请稍后重试。"}\n`);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
      setMessage("起草完成；发送前请把占位符替换为真实信息，并核对事实无误。\n");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage("起草失败，请检查网络后重试。\n");
      }
    } finally {
      setRunning(false);
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new Blob([output], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = kind === "resign" ? "辞职信.txt" : "投诉信.txt";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-label="信函起草工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <FileEdit aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">AI 云端起草 · DeepSeek 驱动</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">辞职信 / 投诉信生成器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">克制 · 有据 · 体面</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">信件类型</legend>
            <div className="mt-2 inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
              {(
                [
                  { id: "resign", label: "辞职信" },
                  { id: "complaint", label: "投诉信" },
                ] as const
              ).map((item) => (
                <button aria-pressed={kind === item.id} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${kind === item.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-emerald-700"}`} key={item.id} onClick={() => setKind(item.id)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="letter-recipient">{kind === "resign" ? "提交给（如：部门负责人）" : "投诉对象（如：某平台/某商家）"}</label>
              <input className={FIELD} id="letter-recipient" onChange={(event) => setRecipient(event.target.value)} type="text" value={recipient} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="letter-writer">落款身份（可选）</label>
              <input className={FIELD} id="letter-writer" onChange={(event) => setWriter(event.target.value)} placeholder={kind === "resign" ? "技术部 · 张三" : "消费者 · 手机号后四位"} type="text" value={writer} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="letter-facts">事实经过</label>
            <textarea
              className={`${FIELD} leading-6`}
              id="letter-facts"
              onChange={(event) => setFacts(event.target.value.slice(0, 6000))}
              placeholder={kind === "resign" ? "例如：在这家公司三年，个人职业规划调整，决定离开；希望能交接完手头项目，最后工作日希望定在下月底。" : "例如：9 月 1 日在某平台购买手机，9 月 4 日出现黑屏，商家拒绝七天无理由退货，只肯维修；有聊天记录和订单截图。"}
              rows={7}
              value={facts}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="letter-demands">我的诉求（可选）</label>
            <input className={FIELD} id="letter-demands" onChange={(event) => setDemands(event.target.value)} placeholder={kind === "resign" ? "希望开具离职证明" : "全额退款并承担运费"} type="text" value={demands} />
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">语气</legend>
            <div className="mt-2 flex gap-2">
              {TONES.map((item) => (
                <button
                  aria-pressed={tone === item.id}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${tone === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"}`}
                  key={item.id}
                  onClick={() => setTone(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={running}
              onClick={() => void run()}
              type="button"
            >
              {running ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
              {running ? "起草中" : "生成文书"}
            </button>
            {running && (
              <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400" onClick={() => abortRef.current?.abort()} type="button">
                取消
              </button>
            )}
            {output && !running && (
              <>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={() => void copyOutput()} type="button">
                  {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                  {copied ? "已复制" : "复制"}
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={downloadTxt} type="button">
                  <Download aria-hidden="true" className="size-4" />
                  下载 TXT
                </button>
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">文书预览</p>
          {output ? (
            <div className="mt-2 max-h-[36rem] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">{output}</div>
          ) : (
            <div className="mt-2 grid h-64 place-items-center rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm text-slate-500">{running ? "AI 正在起草…" : "填写左侧信息后生成"}</p>
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
