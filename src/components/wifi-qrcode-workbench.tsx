"use client";

import { useState } from "react";
import { Check, Copy, Download, Wifi } from "lucide-react";
import QRCode from "qrcode";

import { buildWifiString, WIFI_QR_LIMITS, type WifiEncryption } from "@/lib/wifi-qrcode";

const ENCRYPTIONS: { id: WifiEncryption; label: string; note: string }[] = [
  { id: "WPA", label: "WPA / WPA2 / WPA3", note: "家用与办公路由最常见" },
  { id: "WEP", label: "WEP（老设备）", note: "老旧路由，密码至少 5 位" },
  { id: "nopass", label: "开放网络", note: "无密码，直接连接" },
];

export function WifiQrcodeWorkbench() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<WifiEncryption>("WPA");
  const [hidden, setHidden] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const [message, setMessage] = useState("填写 WiFi 名称与密码，生成二维码；客人扫码即可连网，无需念密码。\n");
  const [copied, setCopied] = useState(false);

  async function generate() {
    try {
      const payload = buildWifiString({ ssid, password, encryption, hidden });
      const url = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, width: 640 });
      setDataUrl(url);
      setMessage("二维码已生成：用手机相机或微信扫一扫即可加入该 WiFi。\n");
    } catch (error) {
      setDataUrl("");
      setMessage(error instanceof Error ? `${error.message}\n` : "生成失败，请检查填写内容。\n");
    }
  }

  async function copyPayload() {
    try {
      const payload = buildWifiString({ ssid, password, encryption, hidden });
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "复制失败。\n");
    }
  }

  const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

  return (
    <section aria-label="WiFi 二维码工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#dcecfa] text-sky-800">
            <Wifi aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-700">浏览器本地生成 · 不上传</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">WiFi 二维码</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">扫码直接连网</span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="wifi-ssid">WiFi 名称（SSID）</label>
            <input className={field} id="wifi-ssid" maxLength={WIFI_QR_LIMITS.maxSsidChars} onChange={(event) => setSsid(event.target.value)} placeholder="例如：Home-5G" type="text" value={ssid} />
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">加密方式</legend>
            <div className="mt-2 grid gap-2">
              {ENCRYPTIONS.map((item) => (
                <button
                  aria-pressed={encryption === item.id}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${encryption === item.id ? "border-emerald-700 bg-emerald-50" : "border-slate-300 bg-white hover:border-emerald-500"}`}
                  key={item.id}
                  onClick={() => setEncryption(item.id)}
                  type="button"
                >
                  <span className={`block text-sm font-semibold ${encryption === item.id ? "text-emerald-800" : "text-slate-900"}`}>{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.note}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {encryption !== "nopass" && (
            <div>
              <label className="block text-sm font-semibold text-slate-900" htmlFor="wifi-password">WiFi 密码</label>
              <input className={field} id="wifi-password" maxLength={WIFI_QR_LIMITS.maxPasswordChars} onChange={(event) => setPassword(event.target.value)} placeholder="路由器背面贴纸上有" type="text" value={password} />
            </div>
          )}

          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
            <input checked={hidden} className="size-4 accent-emerald-700" onChange={(event) => setHidden(event.target.checked)} type="checkbox" />
            隐藏网络（搜不到信号名，需手动扫码加入）
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!ssid.trim()}
              onClick={() => void generate()}
              type="button"
            >
              <Wifi aria-hidden="true" className="size-4" />
              生成二维码
            </button>
            {dataUrl && (
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" onClick={() => void copyPayload()} type="button">
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "已复制" : "复制连接信息"}
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">二维码</p>
          <div className="mt-2 grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="WiFi 二维码" className="w-64 max-w-full rounded-xl bg-white shadow-card" src={dataUrl} />
            ) : (
              <div className="py-10 text-center">
                <Wifi aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">还没有二维码</p>
                <p className="mt-1 text-xs text-slate-400">填写信息并点击「生成二维码」</p>
              </div>
            )}
          </div>
          {dataUrl && (
            <a
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 sm:w-auto"
              download="wifi-qrcode.png"
              href={dataUrl}
            >
              <Download aria-hidden="true" className="size-4" />
              下载 PNG
            </a>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        {message}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">生成在浏览器本地完成，WiFi 密码不会上传；打印后贴在前台或路由器旁最方便。</p>
    </section>
  );
}
