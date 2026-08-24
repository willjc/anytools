import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { ToolCard } from "@/components/tool-card";
import { privateQueryUrl } from "@/lib/site";
import { getToolsForCategory, toolCategories } from "@/lib/tools";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate border-b border-slate-200 bg-[radial-gradient(circle_at_80%_0%,#d1fae5_0,transparent_31%),radial-gradient(circle_at_2%_35%,#e0f2fe_0,transparent_25%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-20 sm:px-8 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-sm font-medium text-emerald-800 shadow-sm">
              <Sparkles aria-hidden="true" className="size-4" />
              20 个实用工具 · 多数本地处理
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-6xl">
              常用文件处理，
              <span className="text-emerald-700">打开就能用。</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              合并 PDF、改字、压缩，裁剪拼图、换算计算。选一个工具马上开始，多数工具文件不出浏览器。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
                href="#tools"
              >
                浏览全部工具 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3.5 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
                href="/tools/pdf-split"
              >
                先拆分 PDF
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/90 bg-white/75 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.13)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>三步完成</span>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300">多数免上传</span>
              </div>
              <ol className="mt-8 space-y-5">
                {["选择一个工具", "处理文件或输入内容", "下载结果"].map((item, index) => (
                  <li className="flex items-center gap-4" key={item}>
                    <span className="grid size-8 place-items-center rounded-full bg-white/10 text-sm font-medium text-emerald-300">{index + 1}</span>
                    <span className="font-medium">{item}</span>
                    {index < 2 ? <span className="ml-auto text-emerald-300">✓</span> : null}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              多数工具在浏览器本地完成，文件不离开设备；标注「云端处理」的功能由服务器即时处理、用后即删。
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="tools">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-emerald-700">工具导航</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">选一个功能，马上开始。</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">每个工具都有独立页面，方便收藏、分享，也方便未来持续扩展。</p>
        </div>

        <div className="mt-12 space-y-14">
          {toolCategories.map((category) => {
            const categoryTools = getToolsForCategory(category.id);

            return (
              <section key={category.id}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">{category.label}</h3>
                    <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                  </div>
                  <span className="text-sm text-slate-500">{categoryTools.length} 个工具</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categoryTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {privateQueryUrl ? (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.16em] text-slate-700">私密服务</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950">受保护查询</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                需要访问密码。连续输错 3 次后将锁定 24 小时。
              </p>
            </div>
            <a
              className="group mt-8 flex max-w-xl items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-700"
              href={privateQueryUrl}
              rel="nofollow"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
                <LockKeyhole aria-hidden="true" className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight text-slate-950">进入受保护页面</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">登录后才能发起和查看查询。</span>
              </span>
              <ArrowRight aria-hidden="true" className="ml-auto size-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-950" />
            </a>
          </div>
        </section>
      ) : null}

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">
          {[
            ["本地优先", "可在浏览器完成的任务不会上传文件。"],
            ["每项独立", "一个功能一个页面，链接清晰且便于检索。"],
            ["持续扩展", "后续高级能力可接入账号、订单和按次付费。"],
          ].map(([title, description]) => (
            <div key={title}>
              <Check aria-hidden="true" className="size-5 text-emerald-700" />
              <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
