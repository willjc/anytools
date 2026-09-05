import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ToolWorkbench } from "@/components/tool-workbench";
import { site, siteUrl } from "@/lib/site";
import { getToolBySlug, tools } from "@/lib/tools";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {};
  }

  const canonicalPath = `/tools/${tool.slug}`;

  return {
    title: tool.name,
    description: tool.longDescription,
    keywords: [...tool.keywords],
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: site.locale,
      title: `${tool.name} · ${site.shortName}`,
      description: tool.description,
      url: canonicalPath,
      siteName: site.name,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const canonicalUrl = `${siteUrl}/tools/${tool.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.longDescription,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: canonicalUrl,
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript and a modern browser.",
  };

  return (
    <div>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700" href="/#tools">
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回工具导航
          </Link>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className={`text-xs font-semibold tracking-[0.18em] ${tool.processing === "cloud" ? "text-sky-700" : "text-emerald-700"}`}>
                {tool.processing === "cloud" ? "CLOUD PROCESSING" : "LOCAL PROCESSING"}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">{tool.name}</h1>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{tool.longDescription}</p>
            </div>
            <span className={`w-fit rounded-lg px-3 py-2 text-xs font-medium ${tool.processing === "cloud" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
              {tool.headerTag ?? (tool.processing === "cloud" ? "云端处理 · 即时删除" : "浏览器本地处理")}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="tech-workbench">
          <ToolWorkbench tool={tool} />
        </div>
        <section className="mt-12 border-t border-slate-300 pt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700">WORKFLOW</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">如何使用</h2>
            </div>
            <span className="text-xs text-slate-500">3 个步骤</span>
          </div>
          <ol className="mt-5 grid border-y border-slate-200 text-sm leading-6 text-slate-600 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
            {(tool.usageSteps
              ? tool.usageSteps
              : tool.processing === "cloud"
                ? ["选择文件并上传到服务器", "服务器完成后自动开始下载", "文件处理后立即删除，不做保存"]
                : ["打开工具页并选择文件或输入内容", "在浏览器中设置所需选项", "下载处理结果，原始文件不会上传"]
            ).map((step, index) => (
              <li className="border-t border-slate-200 px-4 py-5 first:border-t-0 sm:border-t-0 sm:px-5" key={step}>
                <span className="font-mono text-xs font-semibold text-emerald-700">0{index + 1}</span>
                <p className="mt-2">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
