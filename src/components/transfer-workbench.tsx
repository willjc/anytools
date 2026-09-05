"use client";

import { useEffect, useRef, useState } from "react";
import { sha256 } from "@noble/hashes/sha2.js";
import { Copy, Download, FileUp, LogOut, RefreshCw, Send, Share2, Trash2 } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

type Item = { id: string; kind: string; name: string; size: number; status: string; created: number; expires: number; text?: string; shareToken?: string | null; shareExpires?: number | null; hasCode?: boolean };
type User = { id: string; username: string };
const inputClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300";
async function api(route: string, options?: RequestInit) {
  const response = await fetch(`/api/transfer/${route}`, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失败，请重试。");
  return data;
}
function post(route: string, data: unknown = {}) {
  return api(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
function date(time: number) { return new Date(time).toLocaleDateString("zh-CN"); }

export function TransferWorkbench({ shareToken }: { shareToken?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [opened, setOpened] = useState<Item | null>(null);
  const [sharing, setSharing] = useState<Item | null>(null);
  const [shareDays, setShareDays] = useState("7");
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [manualCopy, setManualCopy] = useState("");
  const [shared, setShared] = useState<Item | null>(null);
  const [locked, setLocked] = useState(false);
  const [progress, setProgress] = useState<{ name: string; phase: string; percent: number } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const copyInput = useRef<HTMLTextAreaElement>(null);

  function announce(value: string, failed = false) { setMessage(value); setError(failed); }
  async function loadItems(offset = 0) {
    const data = await api(`items?offset=${offset}`);
    if (!mounted.current) return;
    setItems((current) => offset ? [...current, ...data.items] : data.items);
    setMore(data.more);
  }
  async function loadShared() {
    const data = await api(`share/${shareToken}`);
    if (!mounted.current) return;
    setLocked(Boolean(data.locked)); setShared(data.item ?? null);
  }
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        if (shareToken) {
          const data = await api(`share/${shareToken}`);
          if (mounted.current) { setLocked(Boolean(data.locked)); setShared(data.item ?? null); }
        } else {
          const data = await api("session");
          if (mounted.current) setUser(data.user);
          if (data.user) {
            const list = await api("items");
            if (mounted.current) { setItems(list.items); setMore(list.more); }
          }
        }
      } catch (e) { if (mounted.current) { setMessage((e as Error).message); setError(true); } }
      finally { if (mounted.current) setLoading(false); }
    })();
    return () => { mounted.current = false; controller.current?.abort(); };
  }, [shareToken]);
  useEffect(() => {
    if (manualCopy) { copyInput.current?.focus(); copyInput.current?.select(); }
  }, [manualCopy]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); }
    catch (e) { if (mounted.current) announce(e instanceof Error ? e.message : "操作未完成，请重试。", true); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function copy(value: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(value);
      announce("已复制。");
    } catch {
      setManualCopy(value);
      announce("内容已选中，请按 Ctrl+C / ⌘C，或长按复制。");
    }
  }
  async function upload(files: File[]) {
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    let completed = 0;
    try {
      for (const file of files) {
        if (file.size > 1024 ** 3) throw new Error(`${file.name} 超过 1 GB，请选择更小的文件。`);
        const hash = sha256.create();
        const chunkSize = 8 * 1024 * 1024;
        for (let offset = 0; offset < file.size; offset += chunkSize) {
          abort.signal.throwIfAborted();
          hash.update(new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer()));
          setProgress({ name: file.name, phase: "检查文件", percent: Math.round(Math.min(offset + chunkSize, file.size) / file.size * 100) });
        }
        abort.signal.throwIfAborted();
        const fingerprint = Array.from(hash.digest(), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const pending = await api("upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, fingerprint }), signal: abort.signal });
        let offset = pending.offset;
        while (offset < file.size) {
          abort.signal.throwIfAborted();
          setProgress({ name: file.name, phase: "上传中", percent: Math.floor(offset / file.size * 100) });
          const response = await api(`items/${pending.id}/chunk`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "X-Upload-Offset": String(offset) }, body: file.slice(offset, offset + chunkSize), signal: abort.signal });
          offset = response.offset;
        }
        setProgress({ name: file.name, phase: "校验完整性", percent: 100 });
        await api(`items/${pending.id}/finish`, { method: "POST", signal: abort.signal });
        completed++;
      }
      announce(`已保存 ${completed} 个文件，其他设备登录即可下载。`);
    } catch (e) {
      if (mounted.current) announce(abort.signal.aborted ? "上传已暂停。重新选择相同文件即可继续，未完成上传保留 7 天。" : `${e instanceof Error ? e.message : "上传中断。"} 已完成 ${completed} 个文件。重新选择相同文件可继续上传。`, !abort.signal.aborted);
    } finally {
      if (mounted.current) { setProgress(null); setBusy(false); await loadItems().catch(() => {}); }
    }
  }

  return <section aria-label={shareToken ? "随手传分享" : "随手传工作区"} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
      <div><h2 className="text-xl font-semibold tracking-tight text-slate-950">{shareToken ? "有人给你发来一份内容" : "随手一放，换台设备就能拿"}</h2><p className="mt-2 text-sm text-slate-500">{shareToken ? "无需注册，即可取用。" : "单文件最大 1 GB · 保存 3 年 · 文字和文件都能分享"}</p></div>
      {user && <div className="flex items-center gap-3 text-sm"><span>{user.username}</span><button className={buttonClass} disabled={busy} onClick={() => void run(async () => { await post("logout"); setUser(null); setItems([]); setOpened(null); setSharing(null); setManualCopy(""); setText(""); setTitle(""); announce("已退出登录。"); })}><LogOut className="size-4" />退出</button></div>}
    </div>
    {loading ? <p className="py-8 text-center text-slate-500">正在打开随手传…</p> : shareToken ? <>
      {locked && <form className="mx-auto max-w-sm space-y-4 py-5" onSubmit={(event) => { event.preventDefault(); void run(async () => { await post(`share/${shareToken}/unlock`, { code }); setCode(""); await loadShared(); announce("已解锁。"); }); }}><label className="block text-sm">提取码<input autoComplete="off" className={`mt-2 ${inputClass}`} value={code} onChange={(event) => setCode(event.target.value)} maxLength={128} required /></label><button className={primaryClass} disabled={busy}>查看内容</button></form>}
      {shared && <div className="space-y-4"><h3 className="break-all text-lg font-semibold">{shared.name}</h3><p className="text-sm text-slate-500">{formatFileSize(shared.size)} · 分享有效至 {date(shared.expires)}</p>{shared.kind === "text" ? <><textarea aria-label="分享的文字" className={`${inputClass} min-h-64`} readOnly value={shared.text || ""} /><button className={primaryClass} onClick={() => void copy(shared.text || "")}><Copy className="size-4" />复制文字</button></> : <a className={primaryClass} href={`/api/transfer/share/${shareToken}/download`}><Download className="size-4" />下载原文件</a>}</div>}
      {!locked && !shared && !message && <p>分享不存在或已过期。</p>}
    </> : !user ? <form className="mx-auto max-w-sm space-y-4 py-3" onSubmit={(event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      void run(async () => {
        if (register && form.get("password") !== form.get("confirm")) throw new Error("两次输入的密码不一致。");
        const data = await post("auth", { username: form.get("username"), password: form.get("password"), register });
        setUser(data.user); setRegister(false); await loadItems(); announce(register ? "账号已创建，可以开始传内容了。请记住用户名和密码。" : "登录成功。");
      });
    }}>
      <h3 className="text-lg font-semibold">{register ? "创建你的文件箱" : "登录你的文件箱"}</h3>
      <label className="block text-sm">用户名<input name="username" autoComplete="username" autoCapitalize="none" pattern="[A-Za-z0-9_-]{3,32}" minLength={3} maxLength={32} placeholder="3–32 位字母、数字或下划线" className={`mt-2 ${inputClass}`} required /></label>
      <label className="block text-sm">密码<input name="password" autoComplete={register ? "new-password" : "current-password"} type="password" minLength={8} maxLength={128} className={`mt-2 ${inputClass}`} required /></label>
      {register && <label className="block text-sm">再输入一次密码<input name="confirm" autoComplete="new-password" type="password" minLength={8} maxLength={128} className={`mt-2 ${inputClass}`} required /></label>}
      <button className={`${primaryClass} w-full`} disabled={busy}>{busy ? "请稍候…" : register ? "创建账号并登录" : "登录"}</button>
      <button type="button" className="min-h-11 text-sm text-emerald-700 underline" disabled={busy} onClick={() => { setRegister(!register); announce(""); }}>{register ? "已有账号，去登录" : "第一次使用？创建账号"}</button>
      <p className="text-xs leading-5 text-slate-500">登录状态保留 30 天，公共设备用完请退出。请妥善保存用户名和密码。</p>
    </form> : <>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.55fr]">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { await post("text", { name: title, text }); setText(""); setTitle(""); await loadItems(); announce("文字已保存。"); }); }}>
          <label className="sr-only" htmlFor="transfer-title">文字标题（可选）</label><input id="transfer-title" className={inputClass} placeholder="标题（可选）" value={title} maxLength={200} disabled={busy} onChange={(event) => setTitle(event.target.value)} />
          <label className="sr-only" htmlFor="transfer-text">要传的文字</label><textarea id="transfer-text" className={`${inputClass} min-h-36`} placeholder="把要带走的文字粘贴到这里…" value={text} disabled={busy} onChange={(event) => setText(event.target.value)} maxLength={1000000} />
          <button className={primaryClass} disabled={busy || !text.trim()}><Send className="size-4" />保存文字</button>
        </form>
        <div className="flex flex-col justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <FileUp aria-hidden="true" className="mb-3 size-7 text-sky-700" /><p className="font-medium">文件也随手放进来</p><p className="mb-4 mt-2 text-sm leading-6 text-slate-500">支持任意格式和多文件选择。上传中断后，重新选择相同文件即可接着传。</p>
          <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void upload(files); }} />
          <button className={buttonClass} disabled={busy} onClick={() => fileInput.current?.click()}>选择文件上传</button>
        </div>
      </div>
      {progress && <div className="mt-5 rounded-xl bg-sky-50 p-4"><p className="break-all text-sm">{progress.name} · {progress.phase} {progress.percent}%</p><progress aria-label="文件处理进度" className="mt-3 h-2 w-full accent-emerald-700" max={100} value={progress.percent} /><button className={`${buttonClass} mt-2`} onClick={() => controller.current?.abort()}>暂停上传</button></div>}
      <div className="mb-2 mt-8 flex items-center justify-between"><h3 className="font-semibold">我的内容</h3><button className={buttonClass} disabled={busy} onClick={() => void run(async () => { await loadItems(); announce("列表已刷新。"); })}><RefreshCw className="size-4" />刷新</button></div>
      {!items.length && <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">还没有内容，保存一段文字或上传第一个文件吧。</p>}
      <ul className="divide-y divide-slate-200 border-b border-slate-200">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0 flex-1 basis-48"><p className="break-all text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.kind === "text" ? "文字" : "文件"} · {formatFileSize(item.size)} · {date(item.created)}{item.status === "uploading" ? " · 未完成，重新选择文件可续传（保留 7 天）" : ` · 保存至 ${date(item.expires)}`}{item.shareToken ? " · 分享中" : ""}</p></div>
        <div className="flex flex-wrap gap-2">
          {item.status === "ready" && <>{item.kind === "text" ? <button className={buttonClass} disabled={busy} onClick={() => void run(async () => { const data = await api(`items/${item.id}`); setOpened(data.item); })}>查看文字</button> : <a className={buttonClass} href={`/api/transfer/items/${item.id}/download`}><Download className="size-4" />下载</a>}
          <button className={buttonClass} disabled={busy} aria-label={`分享 ${item.name}`} onClick={() => { setSharing(item); setCode(""); setLinkCode(""); setShareDays("7"); setLink(item.shareToken ? `${location.origin}/transfer/share/${item.shareToken}` : ""); }}><Share2 className="size-4" />分享</button></>}
          <button className={buttonClass} disabled={busy} aria-label={`删除 ${item.name}`} onClick={() => { if (window.confirm(`删除“${item.name}”？分享链接也将失效。`)) void run(async () => { await api(`items/${item.id}`, { method: "DELETE" }); if (opened?.id === item.id) setOpened(null); if (sharing?.id === item.id) setSharing(null); await loadItems(); announce("已删除。"); }); }}><Trash2 className="size-4" /></button>
        </div>
      </li>)}</ul>
      {more && <button className={`${buttonClass} mt-4`} disabled={busy} onClick={() => void run(() => loadItems(items.length))}>加载更多</button>}
      {opened && <div className="mt-5 space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h3 className="break-all font-medium">{opened.name}</h3><button className={buttonClass} onClick={() => setOpened(null)}>收起</button></div><textarea aria-label="已保存的文字" className={`${inputClass} min-h-48`} value={opened.text || ""} readOnly /><button className={primaryClass} onClick={() => void copy(opened.text || "")}><Copy className="size-4" />复制文字</button></div>}
      {sharing && <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h3 className="break-all font-medium">分享：{sharing.name}</h3><button className={buttonClass} onClick={() => setSharing(null)}>收起</button></div><p className="text-xs leading-5 text-slate-500">拿到链接的人可以取用这条内容，不会看到你的其他文件。{sharing.hasCode && "当前链接有提取码。"}</p>
        {link && <><label className="block text-sm">分享链接<input className={`mt-2 ${inputClass}`} value={link} readOnly onFocus={(event) => event.target.select()} /></label><div className="flex flex-wrap gap-2"><button className={primaryClass} onClick={() => void copy(`${link}${linkCode ? `\n提取码：${linkCode}` : ""}`)}><Copy className="size-4" />复制分享链接</button><button className={buttonClass} disabled={busy} onClick={() => void run(async () => { await api(`items/${sharing.id}/share`, { method: "DELETE" }); setLink(""); setCode(""); setLinkCode(""); setSharing({ ...sharing, shareToken: null, hasCode: false }); await loadItems(); announce("分享已取消，原内容仍在文件箱内。"); })}>取消分享</button></div></>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">链接有效期<select className={`mt-2 ${inputClass}`} value={shareDays} disabled={busy} onChange={(event) => setShareDays(event.target.value)}><option value="1">1 天</option><option value="7">7 天</option><option value="30">30 天</option><option value="365">1 年</option></select></label><label className="text-sm">提取码（可选）<input className={`mt-2 ${inputClass}`} placeholder="留空即可直接下载" maxLength={16} value={code} disabled={busy} onChange={(event) => setCode(event.target.value)} /></label></div>
        <button className={buttonClass} disabled={busy} onClick={() => void run(async () => { const data = await post(`items/${sharing.id}/share`, { days: Number(shareDays), code }); setLink(`${location.origin}/transfer/share/${data.token}`); setLinkCode(code); setSharing({ ...sharing, hasCode: Boolean(code) }); await loadItems(); announce("分享链接已生成，可以复制给别人。"); })}>{link ? "按新设置重新生成（旧链接失效）" : "生成分享链接"}</button>
      </div>}
      <details className="mt-7 text-sm text-slate-600"><summary className="min-h-11 cursor-pointer py-3">账号设置 · 修改密码</summary><form className="mt-2 max-w-sm space-y-3" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget, data = new FormData(form); void run(async () => { if (data.get("new") !== data.get("confirm")) throw new Error("两次新密码不一致。"); await post("password", { current: data.get("current"), password: data.get("new") }); form.reset(); announce("密码已修改，其他设备需要重新登录。"); }); }}><label className="block">当前密码<input className={`mt-1 ${inputClass}`} name="current" type="password" autoComplete="current-password" required /></label><label className="block">新密码<input className={`mt-1 ${inputClass}`} name="new" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label className="block">确认新密码<input className={`mt-1 ${inputClass}`} name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><button className={buttonClass} disabled={busy}>修改密码</button></form></details>
    </>}
    {manualCopy && <div className="mt-5"><label className="text-sm">手动复制<textarea ref={copyInput} className={`mt-2 min-h-24 ${inputClass}`} readOnly value={manualCopy} /></label><button className={`${buttonClass} mt-2`} onClick={() => setManualCopy("")}>关闭复制区</button></div>}
    {message && <p role={error ? "alert" : "status"} className={`mt-5 rounded-xl px-4 py-3 text-sm leading-6 ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-950"}`}>{message}</p>}
    {!shareToken && <p className="mt-6 text-xs leading-5 text-slate-500">内容保存在服务器，3 年到期自动清理。当前 HTTP 连接未加密，请勿存放敏感资料。</p>}
  </section>;
}
