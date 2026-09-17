/** 生产入口必须覆盖此可信头，且不能将 Next.js 端口直接暴露给访客。 */
export function clientIpOf(request: Request): string {
  const trusted = request.headers.get("x-suishou-client-ip")?.trim();
  if (trusted) return trusted;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
