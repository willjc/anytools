"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, MonitorSmartphone } from "lucide-react";

import {
  advanceOffset,
  copyCountNeeded,
  fitStaticFontSize,
  MARQUEE_DIRECTIONS,
  MARQUEE_FONT_SIZES,
  MARQUEE_LIMITS,
  marqueeFontSizeOf,
  MARQUEE_SPEEDS,
  marqueeSpeedOf,
  MARQUEE_THEMES,
  marqueeThemeOf,
  type MarqueeDirectionId,
  type MarqueeFontSizeId,
  type MarqueeSpeedId,
  type MarqueeThemeId,
} from "@/lib/marquee";

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 360;

function measureTextWidth(text: string, fontSize: number): number {
  if (typeof document === "undefined") return text.length * fontSize;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize;
  ctx.font = `bold ${fontSize}px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;
  return ctx.measureText(text).width;
}

type ScreenProps = {
  text: string;
  theme: MarqueeThemeId;
  direction: MarqueeDirectionId;
  speed: MarqueeSpeedId;
  fontSize: MarqueeFontSizeId;
  width: number;
  height: number;
};

function MarqueeScreen({ text, theme, direction, speed, fontSize, width, height }: ScreenProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const palette = marqueeThemeOf(theme);
  const basePx = marqueeFontSizeOf(fontSize);

  // 渲染期推导：spanWidth / 副本数 / 静止字号全部由输入决定，无需测量 effect
  const spanWidth = useMemo(() => {
    const textWidth = measureTextWidth(text || "在此输入文字", basePx);
    return textWidth + basePx * 1.6;
  }, [text, basePx]);

  const copies = direction === "static" ? 1 : copyCountNeeded(spanWidth, width);
  const staticPx = useMemo(() => fitStaticFontSize(text, basePx, (size) => measureTextWidth(text, size), width), [text, basePx, width]);

  // 方向切换时在渲染期重置起始偏移（React 官方推荐的 adjust-state-on-prop-change 模式）
  const [offset, setOffset] = useState(0);
  const [previousDirection, setPreviousDirection] = useState(direction);
  if (previousDirection !== direction) {
    setPreviousDirection(direction);
    setOffset(direction === "right" ? -spanWidth : 0);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (direction === "static") {
      track.style.transform = "translateX(0)";
      return;
    }
    let frame = 0;
    let current = direction === "right" ? -spanWidth : 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      current = advanceOffset(current, direction, marqueeSpeedOf(speed), spanWidth, delta);
      track.style.transform = `translateX(${current}px)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [direction, speed, spanWidth]);

  const px = direction === "static" ? staticPx : basePx;

  return (
    <div className="flex h-full w-full items-center overflow-hidden" style={{ backgroundColor: palette.bg }}>
      <div className="flex whitespace-nowrap will-change-transform" ref={trackRef} style={{ transform: `translateX(${offset}px)` }}>
        {Array.from({ length: copies }, (_, index) => (
          <span
            className="shrink-0 font-bold"
            key={index}
            style={{
              color: palette.color,
              fontSize: px,
              lineHeight: `${height}px`,
              paddingRight: direction === "static" ? 0 : basePx * 1.6,
              opacity: text ? 1 : 0.35,
            }}
          >
            {text || "在此输入文字"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MarqueeWorkbench() {
  const [text, setText] = useState("欢迎欢迎");
  const [theme, setTheme] = useState<MarqueeThemeId>("pickup");
  const [direction, setDirection] = useState<MarqueeDirectionId>("left");
  const [speed, setSpeed] = useState<MarqueeSpeedId>("normal");
  const [fontSize, setFontSize] = useState<MarqueeFontSizeId>("large");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("输入文字后点击全屏播放；竖屏手机横过来效果最佳，播放期间屏幕不会自动熄灭。\n");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const [previewScale, setPreviewScale] = useState(0.4);

  const measurePreview = useCallback(() => {
    const width = previewRef.current?.clientWidth ?? BASE_WIDTH;
    setPreviewScale(Math.min(1, width / BASE_WIDTH));
  }, []);

  useLayoutEffect(() => {
    measurePreview();
    window.addEventListener("resize", measurePreview);
    return () => window.removeEventListener("resize", measurePreview);
  }, [measurePreview]);

  useEffect(() => {
    function onFullscreenChange() {
      const active = document.fullscreenElement === fullscreenRef.current;
      setIsFullscreen(active);
      if (!active && wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => undefined);
        wakeLockRef.current = null;
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    const element = fullscreenRef.current;
    if (!element) return;
    try {
      await element.requestFullscreen();
      const navigatorWithLock = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
      if (navigatorWithLock.wakeLock) {
        navigatorWithLock.wakeLock.request("screen").then((lock) => {
          wakeLockRef.current = lock;
        }).catch(() => undefined);
      }
    } catch {
      setMessage("当前环境不支持全屏（部分浏览器要求用户手势后才能全屏），可直接横屏观看预览。\n");
    }
  }

  return (
    <section aria-label="滚动大字屏工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffe8d4] text-orange-800">
            <MonitorSmartphone aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地播放 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">滚动大字屏</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">接机 · 叫号 · 应援</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="marquee-text">
              显示文字
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="marquee-text"
              maxLength={MARQUEE_LIMITS.maxTextChars}
              onChange={(event) => setText(event.target.value)}
              placeholder="例如：接机 · 张先生"
              type="text"
              value={text}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{text.length} / {MARQUEE_LIMITS.maxTextChars} 字</p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">配色</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MARQUEE_THEMES.map((item) => (
                <button
                  aria-pressed={theme === item.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                    theme === item.id ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500"
                  }`}
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="inline-flex h-4 w-7 shrink-0 rounded-sm border border-slate-200" style={{ backgroundColor: item.bg }}>
                    <span className="m-auto h-1 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </span>
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">播放方式</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MARQUEE_DIRECTIONS.map((item) => (
                <button
                  aria-pressed={direction === item.id}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    direction === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                  }`}
                  key={item.id}
                  onClick={() => setDirection(item.id)}
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className={direction === "static" ? "opacity-50" : ""} disabled={direction === "static"}>
              <legend className="text-sm font-semibold text-slate-900">速度</legend>
              <div className="mt-2 flex gap-2">
                {MARQUEE_SPEEDS.map((item) => (
                  <button
                    aria-pressed={speed === item.id}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      speed === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                    }`}
                    key={item.id}
                    onClick={() => setSpeed(item.id)}
                    type="button"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">字号</legend>
              <div className="mt-2 flex gap-2">
                {MARQUEE_FONT_SIZES.map((item) => (
                  <button
                    aria-pressed={fontSize === item.id}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      fontSize === item.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500"
                    }`}
                    key={item.id}
                    onClick={() => setFontSize(item.id)}
                    type="button"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
            onClick={() => void toggleFullscreen()}
            type="button"
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
            {isFullscreen ? "退出全屏" : "全屏播放"}
          </button>
          <p className="text-xs leading-5 text-slate-500">全屏期间屏幕保持常亮；按 Esc 或点右上角按钮退出。</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">实时预览</p>
          <div
            className="mt-2 overflow-hidden rounded-2xl border border-slate-200 shadow-card"
            ref={(node) => {
              previewRef.current = node;
              fullscreenRef.current = node;
            }}
            style={isFullscreen ? { backgroundColor: "#151412" } : { height: BASE_HEIGHT * previewScale }}
          >
            {isFullscreen ? (
              <div className="relative h-screen w-screen">
                <MarqueeScreen direction={direction} fontSize={fontSize} height={780} speed={speed} text={text} theme={theme} width={1600} />
                <button
                  aria-label="退出全屏"
                  className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-2 text-xs font-medium text-white/90"
                  onClick={() => void toggleFullscreen()}
                  type="button"
                >
                  退出 (Esc)
                </button>
              </div>
            ) : (
              <div
                className="origin-top-left"
                style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${previewScale})` }}
              >
                <MarqueeScreen direction={direction} fontSize={fontSize} height={BASE_HEIGHT} speed={speed} text={text} theme={theme} width={BASE_WIDTH} />
              </div>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">预览即最终效果；「静止举牌」会自动缩小字号保证一行放下。</p>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
    </section>
  );
}
