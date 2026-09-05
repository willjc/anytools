"use client";

import { useState } from "react";
import { Eye, EyeOff, FileCheck2, LoaderCircle, LockOpen } from "lucide-react";

import { uploadForProcessing } from "@/lib/cloud-client";
import { formatFileSize, triggerDownload } from "@/lib/file-utils";

type Mode = "encrypt" | "decrypt";

export function PdfProtectWorkbench() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [file, setFile] = useState<File>();
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowModify, setAllowModify] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("加密可设打开密码与权限；解除限制可去掉密码或编辑限制。文件处理完立即删除。\n");

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(
      next === "encrypt"
        ? "设置打开密码与权限后上传，服务器加密并返回新文件。\n"
        : "仅限制编辑的文件可直接解除；设了打开密码的请先输入密码。\n",
    );
  }

  async function run() {
    if (!file) return;

    if (mode === "encrypt" && !userPassword && !ownerPassword) {
      setMessage("请至少设置一个密码（打开密码或权限密码）。\n");
      return;
    }

    setIsProcessing(true);
    setMessage("上传并处理中，请稍候…");
    try {
      const fields: Record<string, string> =
        mode === "encrypt"
          ? {
              mode: "encrypt",
              userPassword,
              ownerPassword,
              allowPrint: String(allowPrint),
              allowCopy: String(allowCopy),
              allowModify: String(allowModify),
            }
          : { mode: "decrypt", password: unlockPassword };

      const blob = await uploadForProcessing("pdf-protect", file, fields);
      const suffix = mode === "encrypt" ? "-加密" : "-已解锁";
      triggerDownload(blob, `${file.name.replace(/\.pdf$/i, "")}${suffix}.pdf`);
      setMessage(
        mode === "encrypt"
          ? `加密完成（256 位 AES），下载应已开始；请牢记密码，丢失无法找回。`
          : `解除完成，下载应已开始；处理后的文件无密码、无权限限制。`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}\n` : "处理失败，请重试。\n");
    } finally {
      setIsProcessing(false);
    }
  }

  const passwordType = showPasswords ? "text" : "password";

  return (
    <section aria-label="PDF 加密与解锁工作区" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d9f3e1] text-emerald-800">
            {mode === "encrypt" ? <FileCheck2 aria-hidden="true" className="size-6" /> : <LockOpen aria-hidden="true" className="size-6" />}
          </span>
          <div>
            <p className="text-sm font-medium text-sky-700">云端处理 · 用后即删</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">PDF 加密与解除限制</h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">256 位 AES 加密</span>
      </div>

      <div className="mt-7 space-y-5">
        <fieldset>
          <legend className="sr-only">选择操作</legend>
          <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
            {(
              [
                { id: "encrypt", label: "加密 / 设权限" },
                { id: "decrypt", label: "解除密码 / 限制" },
              ] as const
            ).map((item) => (
              <button
                aria-pressed={mode === item.id}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === item.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-emerald-700"
                }`}
                key={item.id}
                onClick={() => switchMode(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700">
            选择 PDF 文件
            <input
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected);
                if (selected) setMessage(`已选择 ${selected.name}（${formatFileSize(selected.size)}）。`);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {file && <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}（{formatFileSize(file.size)}）</p>}
        </div>

        {mode === "encrypt" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-900" htmlFor="pdf-user-password">
                  打开密码（可空）
                </label>
                <input
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  id="pdf-user-password"
                  onChange={(event) => setUserPassword(event.target.value)}
                  placeholder="留空则打开无需密码"
                  type={passwordType}
                  value={userPassword}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900" htmlFor="pdf-owner-password">
                  权限密码（可空）
                </label>
                <input
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  id="pdf-owner-password"
                  onChange={(event) => setOwnerPassword(event.target.value)}
                  placeholder="留空则与打开密码相同"
                  type={passwordType}
                  value={ownerPassword}
                />
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-700"
              onClick={() => setShowPasswords((previous) => !previous)}
              type="button"
            >
              {showPasswords ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
              {showPasswords ? "隐藏密码" : "显示密码"}
            </button>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">允许其他人</legend>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {(
                  [
                    { checked: allowPrint, label: "打印", onChange: setAllowPrint },
                    { checked: allowCopy, label: "复制文字", onChange: setAllowCopy },
                    { checked: allowModify, label: "编辑修改", onChange: setAllowModify },
                  ] as const
                ).map((item) => (
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700" key={item.label}>
                    <input
                      checked={item.checked}
                      className="size-4 accent-emerald-700"
                      onChange={(event) => item.onChange(event.target.checked)}
                      type="checkbox"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">取消勾选后，没有权限密码的人将无法进行该操作。</p>
            </fieldset>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-slate-900" htmlFor="pdf-unlock-password">
              打开密码（没有可留空）
            </label>
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              id="pdf-unlock-password"
              onChange={(event) => setUnlockPassword(event.target.value)}
              placeholder="仅限制编辑的文件无需密码"
              type={passwordType}
              value={unlockPassword}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">请仅用于你有权处理的文件；解除后文件不再有任何密码与限制。</p>
          </div>
        )}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!file || isProcessing}
          onClick={() => void run()}
          type="button"
        >
          {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : mode === "encrypt" ? <FileCheck2 aria-hidden="true" className="size-4" /> : <LockOpen aria-hidden="true" className="size-4" />}
          {isProcessing ? "处理中" : mode === "encrypt" ? "上传并加密" : "上传并解除"}
        </button>
        {mode === "encrypt" && <p className="text-xs leading-5 text-slate-500">密码不会保存，请自行牢记；忘记打开密码将无法恢复文件内容。</p>}
      </div>
      <p aria-live="polite" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{message}</p>
    </section>
  );
}
