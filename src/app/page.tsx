import { ArrowRight, LockKeyhole } from "lucide-react";

import { ToolDirectory } from "@/components/tool-directory";
import { privateQueryUrl } from "@/lib/site";

export default function Home() {
  return (
    <div>
      <ToolDirectory />

      {privateQueryUrl ? (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">PRIVATE SERVICE</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">受保护查询</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">需要访问密码；连续输错 3 次将锁定 24 小时。</p>
              </div>
            </div>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
              href={privateQueryUrl}
              rel="nofollow"
            >
              进入受保护页面
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}
