import Link from "next/link";
import { Boxes } from "lucide-react";

import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#fcfdfb]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          className="flex items-center gap-2 font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          href="/"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-slate-950 text-white">
            <Boxes aria-hidden="true" className="size-4" />
          </span>
          {site.shortName}
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link className="transition hover:text-slate-950" href="/#tools">
            全部工具
          </Link>
          <Link
            className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
            href="/tools/qr-code"
          >
            生成二维码
          </Link>
        </nav>
      </div>
    </header>
  );
}
