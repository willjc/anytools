"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  Clapperboard,
  Cloud,
  FileText,
  Globe2,
  ImageIcon,
  LayoutGrid,
  Search,
  ShieldCheck,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { ToolIcon } from "@/components/tool-icon";
import { toolCategories, tools, type ToolCategory } from "@/lib/tools";

type ActiveCategory = ToolCategory | "all";

const categoryIcons: Record<ToolCategory, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  create: WandSparkles,
  av: Clapperboard,
  life: Calculator,
  network: Globe2,
};

const navigationItems: readonly {
  id: ActiveCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "全部工具", icon: LayoutGrid },
  ...toolCategories.map((category) => ({
    id: category.id,
    label: category.label,
    icon: categoryIcons[category.id],
  })),
];

const popularTools = ["pdf-split", "image-compress", "image-grid", "qr-code"]
  .map((slug) => tools.find((tool) => tool.slug === slug))
  .filter((tool) => tool !== undefined);

export function ToolDirectory() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const normalizedQuery = query.trim().toLowerCase();

  const visibleTools = tools.filter((tool) => {
    if (activeCategory !== "all" && tool.category !== activeCategory) return false;
    if (!normalizedQuery) return true;

    return [tool.name, tool.shortName, tool.description, ...tool.keywords]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const visibleGroups = toolCategories
    .map((category) => ({
      category,
      tools: visibleTools.filter((tool) => tool.category === category.id),
    }))
    .filter((group) => group.tools.length > 0);
  const showDirectoryHeading = Boolean(normalizedQuery) || activeCategory !== "all";

  function openFirstResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedQuery && visibleTools[0]) {
      router.push(`/tools/${visibleTools[0].slug}`);
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[96rem] lg:grid-cols-[15.5rem_minmax(0,1fr)]" id="tools">
      <aside className="hidden border-r border-slate-200 bg-white px-4 py-8 lg:sticky lg:top-20 lg:flex lg:h-[calc(100vh-5rem)] lg:self-start lg:flex-col">
        <nav aria-label="工具分类" className="space-y-1">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={activeCategory === id}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-medium transition ${
                activeCategory === id
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              }`}
              key={id}
              onClick={() => setActiveCategory(id)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              {label}
              <span className="ml-auto text-xs tabular-nums text-slate-600">
                {id === "all" ? tools.length : tools.filter((tool) => tool.category === id).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-slate-200 px-4 pt-5 text-xs text-slate-600">
          <p className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-emerald-700" />
            本地处理
          </p>
          <p className="flex items-center gap-2">
            <Cloud aria-hidden="true" className="size-4 text-sky-600" />
            云端处理 · 即时删除
          </p>
        </div>
      </aside>

      <div className="min-w-0 bg-[#fbfbfa] px-5 py-10 sm:px-8 sm:py-16 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700">ANYTOOLS COMMAND CENTER</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-[3.25rem]">
                今天要处理什么？
              </h1>
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500" />
              {tools.length} 个工具可直接使用
            </p>
          </div>

          <form className="mt-8 flex rounded-2xl border border-emerald-600 bg-white p-2 shadow-card focus-within:ring-4 focus-within:ring-emerald-100 sm:p-3" onSubmit={openFirstResult}>
            <label className="sr-only" htmlFor="tool-search">搜索工具</label>
            <Search aria-hidden="true" className="ml-3 mt-3.5 size-5 shrink-0 text-slate-500 sm:mt-[1.125rem]" />
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-slate-950 outline-none placeholder:text-slate-500 sm:py-4"
              id="tool-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索工具，或直接输入任务…"
              type="search"
              value={query}
            />
            <button
              aria-label="打开第一个搜索结果"
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 sm:size-14"
              type="submit"
            >
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          </form>

          <nav aria-label="移动端工具分类" className="category-scroll -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:hidden">
            {navigationItems.map(({ id, label }) => (
              <button
                aria-pressed={activeCategory === id}
                className={`min-h-11 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  activeCategory === id
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                key={id}
                onClick={() => setActiveCategory(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          {activeCategory === "all" && !normalizedQuery ? (
            <section className="mt-10" aria-labelledby="popular-tools-title">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950" id="popular-tools-title">常用工具</h2>
                <span className="text-xs text-slate-500">高频入口</span>
              </div>
              <div className="mt-4 grid grid-cols-2 border-y border-slate-200 bg-white sm:grid-cols-4">
                {popularTools.map((tool, index) => (
                  <Link
                    className={`group flex min-h-24 items-center gap-3 px-4 py-4 transition hover:bg-emerald-50/60 ${index % 2 ? "border-l border-slate-200" : ""} ${index > 1 ? "border-t border-slate-200 sm:border-t-0" : ""} sm:border-l sm:first:border-l-0`}
                    href={`/tools/${tool.slug}`}
                    key={tool.slug}
                  >
                    <ToolIcon className="size-6 shrink-0 text-emerald-700" icon={tool.icon} />
                    <span className="min-w-0 text-base font-medium text-slate-800 group-hover:text-emerald-800">{tool.shortName}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className={showDirectoryHeading ? "mt-10" : "mt-5"} aria-labelledby="directory-title">
            {showDirectoryHeading ? (
              <div className="flex items-end justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700">TOOL DIRECTORY</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950" id="directory-title">
                    {normalizedQuery ? `“${query.trim()}”的搜索结果` : navigationItems.find((item) => item.id === activeCategory)?.label}
                  </h2>
                </div>
                <span aria-live="polite" className="text-sm tabular-nums text-slate-500">{visibleTools.length} 项</span>
              </div>
            ) : (
              <h2 className="sr-only" id="directory-title">按类别浏览</h2>
            )}

            {visibleGroups.length > 0 ? (
              <div>
                {visibleGroups.map(({ category, tools: categoryTools }) => {
                  const CategoryIcon = categoryIcons[category.id];

                  return (
                    <section className="border-b border-slate-200 py-7" key={category.id}>
                      <div className="mb-3 flex items-center gap-3">
                        <CategoryIcon aria-hidden="true" className="size-5 text-emerald-700" strokeWidth={1.8} />
                        <h3 className="text-xl font-semibold text-slate-950">{category.label}</h3>
                        <span className="text-xs text-slate-600">{categoryTools.length} 项</span>
                      </div>
                      <div>
                        {categoryTools.map((tool) => (
                          <Link
                            className="group grid min-h-16 items-center gap-3 border-t border-slate-200 px-1 py-3 transition first:border-t-0 hover:bg-white sm:grid-cols-[minmax(10rem,0.8fr)_minmax(14rem,1.3fr)_auto_1.25rem] sm:px-3"
                            href={`/tools/${tool.slug}`}
                            key={tool.slug}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid size-9 shrink-0 place-items-center text-emerald-700">
                                <ToolIcon className="size-5" icon={tool.icon} />
                              </span>
                              <span className="truncate text-base font-medium text-slate-900 group-hover:text-emerald-800">{tool.name}</span>
                            </span>
                            <span className="hidden text-sm text-slate-500 sm:block">{tool.description}</span>
                            <span className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${tool.processing === "cloud" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {tool.cardTag ?? (tool.processing === "cloud" ? "云端处理" : "本地处理")}
                            </span>
                            <ChevronRight aria-hidden="true" className="hidden size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 sm:block" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="border-b border-slate-200 py-16 text-center">
                <Search aria-hidden="true" className="mx-auto size-7 text-slate-400" />
                <p className="mt-4 font-medium text-slate-800">没有找到匹配工具</p>
                <p className="mt-2 text-sm text-slate-500">换个关键词，或选择“全部工具”继续浏览。</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
