export type IpFamily = 4 | 6;

export type NormalizedQuery =
  | { kind: "ip"; value: string; version: IpFamily }
  | { kind: "domain"; value: string };

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function isLikelyIpv6(value: string): boolean {
  if (!/^[0-9a-fA-F:]+$/.test(value) || !value.includes(":")) return false;
  const doubleColons = value.match(/::/g)?.length ?? 0;
  if (doubleColons > 1) return false;
  const groups = value.split(":");
  if (groups.some((group) => group.length > 4)) return false;
  // "::1" → 3 段,完整 8 段;"::" 至少 3 段
  return doubleColons === 1 ? groups.length >= 3 && groups.length <= 9 : groups.length === 8;
}

export function detectIpVersion(input: string): IpFamily | null {
  const value = input.trim().replace(/^\[|\]$/g, "");
  if (!value) return null;

  const v4 = IPV4_PATTERN.exec(value);
  if (v4) {
    const octetsOk = v4.slice(1).every((octet) => Number(octet) <= 255);
    return octetsOk ? 4 : null;
  }
  return isLikelyIpv6(value) ? 6 : null;
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("::ffff:127.")) return true;

  const v4 = IPV4_PATTERN.exec(ip);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function normalizeLookupQuery(rawInput: string): NormalizedQuery | null {
  let value = rawInput.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split("/")[0];
  if (!value) return null;

  // [IPv6]:port —— 先把方括号内完整取出
  const bracketed = /^\[([0-9a-fA-F:]+)\](?::\d+)?$/.exec(value);
  if (bracketed) {
    const version = detectIpVersion(bracketed[1]);
    return version ? { kind: "ip", value: bracketed[1], version } : null;
  }

  const hasColon = value.includes(":");
  if (hasColon && detectIpVersion(value) === 6) {
    return { kind: "ip", value, version: 6 };
  }
  // host:port(域名或 IPv4 带端口)
  const hostPort = /^([^:]+):\d{1,5}$/.exec(value);
  if (hostPort) value = hostPort[1];
  if (!value) return null;

  const version = detectIpVersion(value);
  if (version) return { kind: "ip", value, version };

  if (!/^[a-z0-9.-]+$/.test(value) || value.includes("..") || value.startsWith("-") || value.startsWith(".")) return null;
  if (value.length > 253 || !DOMAIN_PATTERN.test(value)) return null;
  return { kind: "domain", value };
}

export type GeoInfo = {
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
};

export function formatGeoLine(geo: GeoInfo | undefined): string | null {
  if (!geo) return null;
  const place = [geo.country, geo.region, geo.city].filter(Boolean).join(" ");
  return [place, geo.isp].filter(Boolean).join(" · ") || null;
}
