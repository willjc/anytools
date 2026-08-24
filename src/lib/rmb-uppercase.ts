const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"] as const;
const SMALL_UNITS = ["", "拾", "佰", "仟"] as const;
const GROUP_UNITS = ["", "万", "亿"] as const;

const MAX_AMOUNT = 10 ** 13;

function convertGroup(digits: readonly number[]): string {
  let text = "";
  let pendingZero = false;

  for (let index = 0; index < digits.length; index += 1) {
    const digit = digits[index];
    if (digit === 0) {
      pendingZero = text !== "";
      continue;
    }
    if (pendingZero) {
      text += "零";
      pendingZero = false;
    }
    text += DIGITS[digit] + SMALL_UNITS[digits.length - 1 - index];
  }

  return text;
}

function convertIntegerPart(integerPart: number, groupCount: number): string {
  const padded = String(integerPart).padStart(groupCount * 4, "0");
  let text = "";
  let skippedZeroGroup = false;

  for (let group = 0; group < groupCount; group += 1) {
    const digits = padded.slice(group * 4, group * 4 + 4).split("").map(Number);
    const groupValue = digits.reduce((accumulator, digit) => accumulator * 10 + digit, 0);
    const groupText = convertGroup(digits);

    if (groupValue === 0) {
      if (text !== "") skippedZeroGroup = true;
      continue;
    }

    if (text !== "" && (skippedZeroGroup || digits[0] === 0)) text += "零";
    skippedZeroGroup = false;
    text += groupText + GROUP_UNITS[groupCount - 1 - group];
  }

  return text === "" ? "零" : text;
}

export function toRmbUppercase(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0 || amount >= MAX_AMOUNT) return null;

  const totalFen = Math.round(amount * 100);
  const integerPart = Math.floor(totalFen / 100);
  const jiao = Math.floor((totalFen % 100) / 10);
  const fen = totalFen % 10;

  let text = "";
  if (integerPart > 0 || (jiao === 0 && fen === 0)) {
    const digitCount = String(integerPart).length;
    const groupCount = Math.max(1, Math.ceil(digitCount / 4));
    text += `${convertIntegerPart(integerPart, groupCount)}元`;
  }

  if (jiao > 0) text += `${DIGITS[jiao]}角`;
  if (fen > 0) {
    if (jiao === 0 && integerPart > 0) text += "零";
    text += `${DIGITS[fen]}分`;
  }
  if (jiao === 0 && fen === 0) text += "整";

  return text;
}
