import { describe, expect, it } from "vitest";

import { detectIpVersion, isPrivateIp, normalizeLookupQuery } from "@/lib/ip-lookup";

describe("detectIpVersion", () => {
  it("recognizes IPv4 and IPv6", () => {
    expect(detectIpVersion("8.8.8.8")).toBe(4);
    expect(detectIpVersion("2606:4700::1111")).toBe(6);
    expect(detectIpVersion("::1")).toBe(6);
  });

  it("rejects non-IP input", () => {
    expect(detectIpVersion("example.com")).toBeNull();
    expect(detectIpVersion("999.1.1.1")).toBeNull();
    expect(detectIpVersion("")).toBeNull();
  });
});

describe("isPrivateIp", () => {
  it("flags loopback, RFC1918, link-local, and ULA ranges", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("172.16.0.9")).toBe(true);
    expect(isPrivateIp("169.254.1.1")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
  });

  it("treats public addresses as non-private", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("36.133.40.235")).toBe(false);
    expect(isPrivateIp("2606:4700::1111")).toBe(false);
  });
});

describe("normalizeLookupQuery", () => {
  it("strips scheme, path, and port from pasted URLs", () => {
    expect(normalizeLookupQuery("https://www.zhihu.com/question/123")).toEqual({ kind: "domain", value: "www.zhihu.com" });
    expect(normalizeLookupQuery("http://baidu.com:80/")).toEqual({ kind: "domain", value: "baidu.com" });
  });

  it("keeps bracketed IPv6 with port intact", () => {
    expect(normalizeLookupQuery("[2606:4700::1111]:443")).toEqual({ kind: "ip", value: "2606:4700::1111", version: 6 });
  });

  it("classifies bare IP input without DNS", () => {
    expect(normalizeLookupQuery(" 8.8.8.8 ")).toEqual({ kind: "ip", value: "8.8.8.8", version: 4 });
  });

  it("accepts punycode and subdomains, rejects junk", () => {
    expect(normalizeLookupQuery("xn--fiq228c.com")).toEqual({ kind: "domain", value: "xn--fiq228c.com" });
    expect(normalizeLookupQuery("中文.com")).toBeNull();
    expect(normalizeLookupQuery("-bad-.com")).toBeNull();
    expect(normalizeLookupQuery("a b c")).toBeNull();
    expect(normalizeLookupQuery("")).toBeNull();
  });
});
