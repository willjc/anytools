"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brush, Eraser, History, LoaderCircle, Mic, PencilLine, Play, SkipForward, Sparkles } from "lucide-react";

import type { CharacterJson } from "hanzi-writer";
import {
  addToHistory,
  extractChineseChars,
  guessTargetChar,
  loadHistory,
  sanitizeQuery,
  type HanziHistoryEntry,
} from "@/lib/hanzi-learn";

type WriterApi = {
  animateCharacter: (options?: Record<string, unknown>) => Promise<unknown> | undefined;
  animateStroke: (strokeNumber: number, options?: Record<string, unknown>) => Promise<unknown> | undefined;
  quiz: (options?: Record<string, unknown>) => unknown;
  cancelQuiz: () => void;
};

async function loadCharData(char: string): Promise<CharacterJson> {
  // 走本站同源代理（服务端缓存上游数据），国内访问稳定且不依赖第三方
  const response = await fetch(`/api/tools/hanzi-data/${encodeURIComponent(char)}`);
  if (!response.ok) throw new Error("字形数据加载失败");
  return (await response.json()) as CharacterJson;
}

async function readPinyin(char: string): Promise<string> {
  try {
    const { pinyin } = await import("pinyin-pro");
    return pinyin(char, { type: "array" })[0] ?? "";
  } catch {
    return "";
  }
}

export function HanziLearnWorkbench() {
  const [word, setWord] = useState("");
  const [input, setInput] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [activeChar, setActiveChar] = useState("");
  const [pinyinText, setPinyinText] = useState("");
  const [strokeCount, setStrokeCount] = useState<number | null>(null);
  const [loadingChar, setLoadingChar] = useState(false);
  const [writerMode, setWriterMode] = useState<"idle" | "animating" | "quiz">("idle");
  const [meaning, setMeaning] = useState("");
  const [meaningRunning, setMeaningRunning] = useState(false);
  const [history, setHistory] = useState<HanziHistoryEntry[]>([]);
  const [speechState, setSpeechState] = useState<"idle" | "recording" | "processing">("idle");
  const [message, setMessage] = useState("按住麦克风说一个词（比如“节约的约”），或者直接输入汉字，就能看笔顺、练描红、听讲解。\n");
  const [supported, setSupported] = useState(true);

  const displayRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<WriterApi | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const nextStrokeRef = useRef(0);

  useEffect(() => {
    setHistory(loadHistory());
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
    return () => {
      abortRef.current?.abort();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const learnChar = useCallback((char: string, sourceWord: string) => {
    setActiveChar(char);
    setPinyinText("");
    setStrokeCount(null);
    setWriterMode("idle");
    setMeaning("");
    nextStrokeRef.current = 0;
    setHistory((previous) => addToHistory(previous, char, sourceWord));
  }, []);

  // activeChar 变化后（DOM 已提交）再挂载 writer 与拼音
  useEffect(() => {
    if (!activeChar) return;
    let cancelled = false;

    void readPinyin(activeChar).then((py) => {
      if (!cancelled && py) setPinyinText(py);
    });

    void (async () => {
      const target = displayRef.current;
      if (!target || cancelled) return;
      setLoadingChar(true);
      try {
        const HanziWriter = (await import("hanzi-writer")).default;
        target.innerHTML = "";
        const writer = HanziWriter.create(target, activeChar, {
          width: 300,
          height: 300,
          padding: 12,
          strokeColor: "#21201c",
          highlightColor: "#047857",
          outlineColor: "#ddd9d2",
          delayBetweenStrokes: 260,
          strokeAnimationSpeed: 1.1,
          showHintAfterMisses: 2,
          charDataLoader: (charInner: string) =>
            loadCharData(charInner).then((data) => {
              if (Array.isArray((data as { strokes?: string[] }).strokes)) {
                if (!cancelled) setStrokeCount((data as { strokes: unknown[] }).strokes.length);
              }
              return data;
            }),
        });
        if (!cancelled) writerRef.current = writer;
      } catch {
        if (!cancelled) setMessage("字形数据加载失败，请检查网络后重试。\n");
      } finally {
        if (!cancelled) setLoadingChar(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChar]);

  function chooseWord(source: string) {
    const trimmed = source.trim();
    const chars = extractChineseChars(trimmed);
    if (chars.length === 0) {
      setMessage("没有认出汉字，请再说一遍或输入词语。\n");
      return;
    }
    const target = guessTargetChar(trimmed) ?? chars[chars.length - 1];
    setWord(trimmed);
    setCandidates(chars);
    learnChar(target, trimmed);
    setMessage(`选好了「${target}」，可以播放笔顺、练描红，或让 AI 老师讲讲它的意思。`);
  }

  // ---- 语音 ----
  async function startRecording() {
    if (speechState !== "idle") return;
    if (!supported) {
      setMessage("这个浏览器不支持录音，请让家长直接输入文字。\n");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const duration = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (duration < 600 || blob.size < 1200) {
          setSpeechState("idle");
          setMessage("说话时间太短啦，再试一次，说完整一点（比如：节约的约）。\n");
          return;
        }
        void submitRecording(blob, recorder.mimeType.includes("mp4") ? "recording.mp4" : "recording.webm");
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setSpeechState("recording");
      setMessage("正在听……说完松手");
    } catch {
      setSpeechState("idle");
      setMessage("无法使用麦克风（请检查浏览器权限），也可以让家长直接输入文字。\n");
    }
  }

  function stopRecording() {
    if (speechState === "recording" && recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setSpeechState("processing");
    }
  }

  async function submitRecording(blob: Blob, filename: string) {
    setMessage("正在识别……");
    try {
      const formData = new FormData();
      formData.append("file", blob, filename);
      const response = await fetch("/api/tools/hanzi-transcribe", { method: "POST", body: formData });
      const data = (await response.json()) as { text?: string; error?: string };
      setSpeechState("idle");
      if (!response.ok) {
        setMessage(`${data.error ?? "识别失败，请直接输入文字。"}\n`);
        return;
      }
      chooseWord(data.text ?? "");
    } catch {
      setSpeechState("idle");
      setMessage("识别失败，请直接输入文字。\n");
    }
  }

  // ---- 笔顺控制 ----
  async function playAll() {
    const writer = writerRef.current;
    if (!writer) return;
    writer.cancelQuiz();
    setWriterMode("animating");
    await writer.animateCharacter({ onComplete: () => setWriterMode("idle") });
  }

  async function playNextStroke() {
    const writer = writerRef.current;
    if (!writer || strokeCount === null) return;
    writer.cancelQuiz();
    setWriterMode("animating");
    await writer.animateStroke(nextStrokeRef.current % strokeCount);
    nextStrokeRef.current = (nextStrokeRef.current + 1) % strokeCount;
    setWriterMode("idle");
  }

  function startQuiz() {
    const writer = writerRef.current;
    if (!writer) return;
    nextStrokeRef.current = 0;
    writer.quiz({
      onMistake: (data: { strokeNum: number }) => setMessage(`第 ${data.strokeNum + 1} 笔没写对，看清楚再试一次！`),
      onCorrectStroke: (data: { strokeNum: number }) => setMessage(`第 ${data.strokeNum + 1} 笔写对了，继续！`),
      onComplete: () => {
        setWriterMode("idle");
        setMessage("写完啦，真棒！再播放一遍笔顺看看对不对。\n");
      },
    });
    setWriterMode("quiz");
    setMessage("跟着灰色的字描红，按笔顺写，写错会提醒你。\n");
  }

  function resetWriter() {
    if (!activeChar) return;
    if (writerRef.current) writerRef.current.cancelQuiz();
    learnChar(activeChar, word);
  }

  // ---- AI 字义 ----
  async function fetchMeaning() {
    if (!activeChar) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setMeaningRunning(true);
    setMeaning("");
    try {
      const response = await fetch("/api/tools/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "hanzi", input: sanitizeQuery(activeChar), extra: sanitizeQuery(word) || undefined }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setMeaning(`⚠️ ${data?.error ?? "讲解获取失败，请稍后重试。"}`);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMeaning(accumulated);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMeaning("⚠️ 讲解获取失败，请稍后重试。");
      }
    } finally {
      setMeaningRunning(false);
    }
  }

  const micLabel = speechState === "recording" ? "松开结束" : speechState === "processing" ? "识别中…" : "按住说话";

  return (
    <section aria-label="汉字笔顺学习工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fef7d6] text-amber-800">
            <Brush aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">笔顺本地动画 · 字义由 AI 讲解</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">汉字笔顺学习</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">给小学生查字学字</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6">
            <button
              aria-label={micLabel}
              className={`grid size-24 touch-none place-items-center rounded-full text-white shadow-lift transition ${speechState === "recording" ? "animate-pulse bg-red-600" : speechState === "processing" ? "bg-slate-400" : "bg-emerald-700 hover:bg-emerald-800"}`}
              disabled={speechState === "processing"}
              onPointerDown={() => void startRecording()}
              onPointerUp={stopRecording}
              onPointerLeave={speechState === "recording" ? stopRecording : undefined}
              type="button"
            >
              {speechState === "processing" ? <LoaderCircle aria-hidden="true" className="size-10 animate-spin" /> : <Mic aria-hidden="true" className="size-10" />}
            </button>
            <p className="text-sm font-semibold text-slate-900">{micLabel}</p>
            <p className="text-center text-xs leading-5 text-slate-500">
              {supported ? "按住说一个词，比如“节约的约”，说完松手" : "此浏览器不支持录音，请直接输入文字"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="hanzi-input">输入词语或单字（家长可帮忙）</label>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                id="hanzi-input"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") chooseWord(input || word); }}
                placeholder="例如：节约的约"
                type="text"
                value={input}
              />
              <button className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800" onClick={() => chooseWord(input || word)} type="button">
                <Sparkles aria-hidden="true" className="size-4" />
                学习
              </button>
            </div>
          </div>

          {candidates.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">要学哪个字？点一下</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {candidates.map((char) => (
                  <button
                    aria-pressed={activeChar === char}
                    className={`size-14 rounded-2xl border text-2xl font-semibold transition ${activeChar === char ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-900 hover:border-emerald-500"}`}
                    key={char}
                    onClick={() => learnChar(char, word)}
                    type="button"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <History aria-hidden="true" className="size-3.5" />
                最近学过
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {history.slice(0, 12).map((item) => (
                  <button
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${activeChar === item.char ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"}`}
                    key={item.char}
                    onClick={() => learnChar(item.char, item.word)}
                    type="button"
                  >
                    {item.char}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6">
            {activeChar ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-emerald-800">{activeChar}</span>
                  {pinyinText && <span className="text-lg text-slate-600">{pinyinText}</span>}
                  {strokeCount !== null && <span className="text-sm text-slate-500">{strokeCount} 画</span>}
                  {loadingChar && <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-slate-400" />}
                </div>
                <div aria-label={`${activeChar} 笔顺展示区`} ref={displayRef} />
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50" disabled={writerMode === "animating" || loadingChar} onClick={() => void playAll()} type="button">
                    <Play aria-hidden="true" className="size-3.5" />
                    播放笔顺
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50" disabled={writerMode === "animating" || loadingChar || strokeCount === null} onClick={() => void playNextStroke()} type="button">
                    <SkipForward aria-hidden="true" className="size-3.5" />
                    下一笔
                  </button>
                  <button
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition disabled:opacity-50 ${writerMode === "quiz" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700"}`}
                    disabled={writerMode === "animating" || loadingChar}
                    onClick={startQuiz}
                    type="button"
                  >
                    <PencilLine aria-hidden="true" className="size-3.5" />
                    描红练习
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50" disabled={loadingChar} onClick={resetWriter} type="button">
                    <Eraser aria-hidden="true" className="size-3.5" />
                    重新写
                  </button>
                </div>
              </>
            ) : (
              <div className="py-14 text-center">
                <Brush aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">还没有选字</p>
                <p className="mt-1 text-xs text-slate-400">说话或输入一个词，点选要学的字</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">这个字是什么意思？</p>
            {activeChar && (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                disabled={meaningRunning}
                onClick={() => void fetchMeaning()}
                type="button"
              >
                {meaningRunning ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Sparkles aria-hidden="true" className="size-3.5" />}
                再讲一遍
              </button>
            )}
          </div>
          <div aria-live="polite" className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            {meaning ? (
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{meaning}</div>
            ) : meaningRunning ? (
              <p className="text-sm text-slate-500">老师正在讲解「{activeChar}」…</p>
            ) : activeChar ? (
              <p className="text-sm text-slate-500">点击「再讲一遍」，AI 老师会用你听得懂的话讲解字义、组词和口诀。</p>
            ) : (
              <p className="text-sm text-slate-500">选好字后，这里会出现儿童版的字义讲解。</p>
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">笔顺动画与描红在浏览器本地运行（字形数据来自开源 Hanzi Writer 数据库）；字义讲解由 AI 生成，建议家长陪同确认。学过的字保存在本机浏览器。语音识别需要浏览器授权麦克风。</p>
    </section>
  );
}
