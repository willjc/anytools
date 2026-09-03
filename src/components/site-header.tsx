import Link from "next/link";
import Image from "next/image";
import { QrCode } from "lucide-react";

import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[96rem] items-center justify-between px-5 sm:px-8">
        <Link
          className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          href="/"
        >
          <Image alt={site.shortName} className="h-9 w-auto sm:h-11" height={44} priority src="/logo-logo/logo.svg" width={206} />
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-3 text-sm font-medium text-slate-600 sm:gap-5">
          <Link className="hidden min-h-11 items-center transition hover:text-slate-950 sm:inline-flex" href="/#tools">
            全部工具
          </Link>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 sm:min-h-12 sm:px-6"
            href="/tools/qr-code"
          >
            <QrCode aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">生成二维码</span>
            <span className="sm:hidden">二维码</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
