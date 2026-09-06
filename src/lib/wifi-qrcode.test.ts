import { describe, expect, it } from "vitest";

import { buildWifiString, escapeWifiValue, validateWifiDetails } from "@/lib/wifi-qrcode";

describe("escapeWifiValue", () => {
  it("escapes special characters", () => {
    expect(escapeWifiValue('my;wifi,"x"')).toBe("my\\;wifi\\,\\\"x\\\"");
    expect(escapeWifiValue("back\\slash")).toBe("back\\\\slash");
  });

  it("keeps plain values untouched", () => {
    expect(escapeWifiValue("Home-WiFi_5G")).toBe("Home-WiFi_5G");
  });
});

describe("validateWifiDetails", () => {
  it("requires an ssid", () => {
    expect(validateWifiDetails({ ssid: " ", password: "12345678", encryption: "WPA" })).toContain("WiFi 名称");
  });

  it("enforces minimum password lengths", () => {
    expect(validateWifiDetails({ ssid: "a", password: "1234", encryption: "WPA" })).toContain("至少 8 位");
    expect(validateWifiDetails({ ssid: "a", password: "1234", encryption: "WEP" })).toContain("至少 5 位");
    expect(validateWifiDetails({ ssid: "a", password: "", encryption: "nopass" })).toBeNull();
  });

  it("accepts a valid configuration", () => {
    expect(validateWifiDetails({ ssid: "Home", password: "password1", encryption: "WPA" })).toBeNull();
  });
});

describe("buildWifiString", () => {
  it("builds a WPA payload", () => {
    expect(buildWifiString({ ssid: "Home", password: "password1", encryption: "WPA", hidden: false })).toBe(
      "WIFI:T:WPA;S:Home;P:password1;;",
    );
  });

  it("builds an open network without a password field", () => {
    expect(buildWifiString({ ssid: "Cafe", password: "", encryption: "nopass", hidden: false })).toBe(
      "WIFI:T:nopass;S:Cafe;;",
    );
  });

  it("escapes values and marks hidden networks", () => {
    expect(
      buildWifiString({ ssid: "of;fi", password: 'pa,ss:"w"', encryption: "WPA", hidden: true }),
    ).toBe('WIFI:T:WPA;S:of\\;fi;P:pa\\,ss\\:\\"w\\";H:true;;');
  });

  it("throws on invalid input", () => {
    expect(() => buildWifiString({ ssid: "", password: "", encryption: "nopass", hidden: false })).toThrow(/WiFi 名称/);
  });
});
