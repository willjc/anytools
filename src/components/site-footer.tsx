import Link from "next/link";

import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#fbfbfa]">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} {site.name} · 让文件处理更简单。</p>
        <div className="flex gap-5">
          <Link className="inline-flex min-h-11 items-center hover:text-slate-900" href="/#tools">
            工具导航
          </Link>
          <Link className="inline-flex min-h-11 items-center hover:text-slate-900" href="/tools/pdf-split">
            PDF 工具
          </Link>
          <Link className="inline-flex min-h-11 items-center hover:text-slate-900" href="/tools/image-compress">
            图片工具
          </Link>
        </div>
      </div>
    </footer>
  );
}
