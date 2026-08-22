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
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950" href="/#tools">
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回工具导航
      </Link>
      <div className="mt-10 max-w-3xl">
        <p className={`text-sm font-semibold tracking-[0.16em] ${tool.availability === "ready" ? "text-emerald-700" : "text-amber-700"}`}>{tool.availability === "ready" ? "本地工具" : "功能开发中"}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">{tool.name}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{tool.longDescription}</p>
      </div>
      <div className="mt-10">
        <ToolWorkbench tool={tool} />
      </div>
      <section className="mt-12 rounded-3xl bg-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">如何使用</h2>
        <ol className="mt-5 grid gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-3">
          {(tool.availability === "ready"
            ? ["打开工具页并选择文件或输入内容", "在浏览器中设置所需选项", "下载处理结果，原始文件不会保存"]
            : ["该工具正在开发", "现阶段不能上传或处理文件", "开放后会在此页面提供本地处理"]
          ).map((step, index) => (
            <li className="rounded-2xl bg-white p-4" key={step}>
              <span className="text-sm font-semibold text-emerald-700">0{index + 1}</span>
              <p className="mt-2">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
