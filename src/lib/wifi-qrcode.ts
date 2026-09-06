/**
 * WiFi 二维码的 payload 构建（Android/iOS 扫码连网的标准格式）。
 * WIFI:T:<加密>;S:<SSID>;P:<密码>;H:<是否隐藏>;;
 */

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export type WifiDetails = {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
};

export const WIFI_QR_LIMITS = {
  maxSsidChars: 32,
  maxPasswordChars: 63,
} as const;

/** WiFi 字符串中的特殊字符需要反斜杠转义。 */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"'])/g, "\\$1");
}

export function validateWifiDetails({ ssid, password, encryption }: Omit<WifiDetails, "hidden">): string | null {
  if (!ssid.trim()) return "请填写 WiFi 名称（SSID）。";
  if (ssid.length > WIFI_QR_LIMITS.maxSsidChars) return `WiFi 名称最长 ${WIFI_QR_LIMITS.maxSsidChars} 个字符。`;
  if (encryption !== "nopass") {
    if (!password) return "该加密方式需要填写密码。";
    if (encryption === "WEP" && password.length < 5) return "WEP 密码至少 5 位。";
    if (encryption === "WPA" && password.length < 8) return "WPA/WPA2 密码至少 8 位。";
    if (password.length > WIFI_QR_LIMITS.maxPasswordChars) return `密码最长 ${WIFI_QR_LIMITS.maxPasswordChars} 个字符。`;
  }
  return null;
}

export function buildWifiString({ ssid, password, encryption, hidden }: WifiDetails): string {
  const error = validateWifiDetails({ ssid, password, encryption });
  if (error) throw new Error(error);
  const parts = [`T:${encryption}`, `S:${escapeWifiValue(ssid)}`];
  if (encryption !== "nopass") {
    parts.push(`P:${escapeWifiValue(password)}`);
  }
  if (hidden) {
    parts.push("H:true");
  }
  return `WIFI:${parts.join(";")};;`;
}
