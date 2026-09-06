"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";

/** 把文本切成适合朗读的段：按句读切分，单段不超过 ~80 字。 */
export function splitSpeechChunks(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^。！？!?\n]+[。！？!?\n]?/g) ?? [];
  const chunks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if ((buffer + sentence).length > 80 && buffer) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

const RATE_OPTIONS = [
  { id: "slow", label: "慢速", value: 0.75 },
  { id: "normal", label: "正常", value: 1 },
  { id: "fast", label: "快速", value: 1.25 },
] as const;

export function TtsReaderWorkbench() {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [rateId, setRateId] = useState<(typeof RATE_OPTIONS)[number]["id"]>("normal");
  const [voiceName, setVoiceName] = useState("");
  const [message, setMessage] = useState("粘贴文章后点击朗读；朗读由浏览器本地语音合成完成，文字不上传。\n");
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const stoppedRef = useRef(false);

  const rate = useMemo(() => RATE_OPTIONS.find((item) => item.id === rateId)?.value ?? 1, [rateId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) {
        setSupported(false);
        return;
      }
      function loadVoices() {
        const all = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("zh"));
        setVoices(all);
      }
      // 订阅语音列表变化事件（浏览器就绪后会触发）
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    });
    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function refreshVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const all = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("zh"));
    setVoices(all);
  }

  function speakChunk(index: number) {
    const chunks = chunksRef.current;
    if (stoppedRef.current || index >= chunks.length) {
      setState("idle");
      setProgress({ index: 0, total: 0 });
      setMessage("朗读完毕。\n");
      return;
    }
    indexRef.current = index;
    setProgress({ index: index + 1, total: chunks.length });
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    const voice = voices.find((item) => item.name === voiceName);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (!stoppedRef.current) speakChunk(index + 1);
    };
    utterance.onerror = () => {
      if (!stoppedRef.current) {
        setState("idle");
        setMessage("朗读中断，浏览器语音服务不可用，请重试。\n");
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function play() {
    const trimmed = text.trim();
    if (!trimmed) {
      setMessage("请先粘贴要朗读的文章。\n");
      return;
    }
    window.speechSynthesis.cancel();
    stoppedRef.current = false;
    chunksRef.current = splitSpeechChunks(trimmed);
    setState("playing");
    speakChunk(0);
  }

  function pauseOrResume() {
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    }
  }

  function stop() {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setState("idle");
    setProgress({ index: 0, total: 0 });
  }

  return (
    <section aria-label="文章朗读工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <Volume2 aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地语音 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">文章朗读器</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">通勤听文 · 免提阅读</span>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-900" htmlFor="tts-text">要朗读的文章</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            id="tts-text"
            onChange={(event) => setText(event.target.value.slice(0, 20000))}
            placeholder="粘贴文章、通知或公众号内容，点击朗读即可边走边听。"
            rows={9}
            value={text}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{text.length} 字</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <fieldset disabled={!supported}>
            <legend className="sr-only">语速</legend>
            <div className="flex gap-2">
              {RATE_OPTIONS.map((item) => (
                <button
                  aria-pressed={rateId === item.id}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${rateId === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"}`}
                  key={item.id}
                  onClick={() => setRateId(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          {voices.length > 0 && (
            <select aria-label="语音" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600" onFocus={refreshVoices} onChange={(event) => setVoiceName(event.target.value)} value={voiceName}>
              <option value="">默认语音</option>
              {voices.map((voice) => <option key={voice.name} value={voice.name}>{voice.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!supported || state === "playing"}
            onClick={play}
            type="button"
          >
            <Play aria-hidden="true" className="size-4" />
            {state === "paused" ? "重新朗读" : "开始朗读"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state === "idle"}
            onClick={pauseOrResume}
            type="button"
          >
            <Pause aria-hidden="true" className="size-4" />
            {state === "paused" ? "继续" : "暂停"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state === "idle"}
            onClick={stop}
            type="button"
          >
            <Square aria-hidden="true" className="size-4" />
            停止
          </button>
          {progress.total > 0 && state !== "idle" && (
            <span aria-live="polite" className="self-center text-sm text-slate-500">正在读第 {progress.index} / {progress.total} 段</span>
          )}
        </div>

        {!supported && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">当前浏览器不支持语音合成，请使用 Chrome / Edge / Safari 等主流浏览器。</p>
        )}
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
