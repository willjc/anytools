import type { Metadata } from "next";
import Link from "next/link";
import { TransferWorkbench } from "@/components/transfer-workbench";

export const metadata: Metadata = { title: "随手传 · 接收分享", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href="/tools/transfer" className="mb-6 inline-flex min-h-11 items-center text-sm text-emerald-700">随手传 · 打开我的文件箱</Link><TransferWorkbench shareToken={token} /></main>;
}
