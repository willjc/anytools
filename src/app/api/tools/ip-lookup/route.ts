import dnsPromises from "node:dns/promises";
import { NextResponse } from "next/server";

import { formatGeoLine, isPrivateIp, normalizeLookupQuery, type GeoInfo } from "@/lib/ip-lookup";

export const runtime = "nodejs";

const GEO_TIMEOUT_MS = 5000;
const DNS_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };
const geoCache = new Map<string, CacheEntry<GeoInfo | null>>();
const dnsCache = new Map<string, CacheEntry<DnsLookupResult>>();

function cacheGet<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (cache.size > 500) cache.clear();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

type IpApiResponse = {
  status: "success" | "fail";
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
};

async function fetchIpGeo(ip: string): Promise<GeoInfo | null> {
  const cached = cacheGet(geoCache, ip);
  if (cached !== null) return cached;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=status,country,regionName,city,isp`,
      { signal: AbortSignal.timeout(GEO_TIMEOUT_MS), cache: "no-store" },
    );
    const data = (await response.json()) as IpApiResponse;
    const geo: GeoInfo | null =
      data.status === "success"
        ? { country: data.country, region: data.regionName, city: data.city, isp: data.isp }
        : null;
    cacheSet(geoCache, ip, geo);
    return geo;
  } catch {
    // 归属地服务不可用时优雅降级:只返回 IP 本身。
    return null;
  }
}

type DnsLookupResult = {
  a: string[];
  aaaa: string[];
  cname: string[];
  mx: { exchange: string; priority: number }[];
  ns: string[];
  txt: string[];
};

async function resolveDomain(domain: string): Promise<DnsLookupResult> {
  const cached = cacheGet(dnsCache, domain);
  if (cached) return cached;

  const resolver = new dnsPromises.Resolver({ timeout: DNS_TIMEOUT_MS, tries: 2 });
  const [a, aaaa, cname, mx, ns, txt] = await Promise.allSettled([
    resolver.resolve4(domain),
    resolver.resolve6(domain),
    resolver.resolveCname(domain),
    resolver.resolveMx(domain),
    resolver.resolveNs(domain),
    resolver.resolveTxt(domain),
  ]);

  const result: DnsLookupResult = {
    a: a.status === "fulfilled" ? a.value : [],
    aaaa: aaaa.status === "fulfilled" ? aaaa.value : [],
    cname: cname.status === "fulfilled" ? cname.value : [],
    mx: mx.status === "fulfilled" ? mx.value : [],
    ns: ns.status === "fulfilled" ? ns.value : [],
    txt: txt.status === "fulfilled" ? txt.value.map((chunks) => chunks.join("")) : [],
  };

  const total = result.a.length + result.aaaa.length + result.cname.length + result.mx.length + result.ns.length + result.txt.length;
  if (total === 0) {
    throw new Error("未能解析该域名：请检查拼写，或该域名没有配置任何 DNS 记录。");
  }

  cacheSet(dnsCache, domain, result);
  return result;
}

function clientIpFromHeaders(request: Request): { ip: string; isPrivate: boolean } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "";
  return { ip, isPrivate: ip === "" || isPrivateIp(ip) };
}

export async function GET(request: Request) {
  const { ip, isPrivate } = clientIpFromHeaders(request);
  const geo = isPrivate ? null : await fetchIpGeo(ip);

  return NextResponse.json(
    {
      ok: true,
      ip,
      isPrivate,
      geo,
      geoLine: formatGeoLine(geo ?? undefined),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let query = "";
  try {
    const body = (await request.json()) as { query?: string };
    query = body.query ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "请求格式不正确。" }, { status: 400 });
  }

  const normalized = normalizeLookupQuery(query);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: "请输入有效的域名或 IP 地址（暂不支持中文域名，请使用英文域名）。" },
      { status: 400 },
    );
  }

  try {
    if (normalized.kind === "ip") {
      const geo = isPrivateIp(normalized.value) ? null : await fetchIpGeo(normalized.value);
      return NextResponse.json(
        {
          ok: true,
          kind: "ip",
          query: normalized.value,
          records: { a: normalized.version === 4 ? [normalized.value] : [], aaaa: normalized.version === 6 ? [normalized.value] : [], cname: [], mx: [], ns: [], txt: [] },
          geo: geo ? { [normalized.value]: geo } : {},
          geoLines: geo ? { [normalized.value]: formatGeoLine(geo) } : {},
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const domain = normalized.value;
    const records = await resolveDomain(domain);
    const geoTargets = [...new Set([...records.a.slice(0, 2), ...records.aaaa.slice(0, 1)])];
    const geoEntries = await Promise.all(geoTargets.map(async (ip) => [ip, await fetchIpGeo(ip)] as const));
    const geo = Object.fromEntries(geoEntries.filter(([, value]) => value !== null));
    const geoLines = Object.fromEntries(geoEntries.filter(([, value]) => value !== null).map(([ip, value]) => [ip, formatGeoLine(value ?? undefined)]));

    return NextResponse.json(
      { ok: true, kind: "domain", query: domain, records, geo, geoLines },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "查询失败，请稍后重试。" },
      { status: 502 },
    );
  }
}
