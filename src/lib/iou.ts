/**
 * 借条文本模板生成。文书要素参考民间借贷通行规范：
 * 金额大小写、身份信息、利率上限（LPR 四倍）提示、交付方式与凭证。
 */

export type IouDetails = {
  lender: string;
  borrower: string;
  amountYuan: number;
  /** 年利率（百分比数字，如 8 表示 8%）；0 或空表示不计息 */
  annualRatePercent?: number;
  loanDate: string;
  repaymentDate: string;
  purpose?: string;
  lenderId?: string;
  borrowerId?: string;
  payMethod?: string;
};

export function formatChineseAmount(amount: number): string {
  const digits = "零壹贰叁肆伍陆柒捌玖";
  const units = ["", "拾", "佰", "仟"];
  const bigUnits = ["", "万", "亿", "兆"];
  const value = Math.floor(Math.abs(amount));
  if (Math.abs(amount) < 0.005) return "零元整";
  let intValue = value;
  let sectionIndex = 0;
  let result = "";
  let lastSectionShort = false;
  while (intValue > 0) {
    const section = intValue % 10000;
    if (section > 0) {
      let sectionText = "";
      let sectionValue = section;
      let unitIndex = 0;
      let zeroPending = false;
      while (sectionValue > 0) {
        const digit = sectionValue % 10;
        if (digit === 0) {
          zeroPending = sectionText !== "";
        } else {
          sectionText = digits[digit] + units[unitIndex] + (zeroPending ? "零" : "") + sectionText;
          zeroPending = false;
        }
        sectionValue = Math.floor(sectionValue / 10);
        unitIndex += 1;
      }
      // 跨节补零：上一节不足仟位时（如 10 万零 501），在节单位后补零
      const crossZero = sectionIndex > 0 && lastSectionShort && !result.startsWith("零");
      result = sectionText + bigUnits[sectionIndex] + (crossZero ? "零" : "") + result;
      lastSectionShort = section < 1000;
    } else {
      // 整节为空（如 1000001 的万位）：仅在已有数字时保持补零状态
      if (result !== "") {
        lastSectionShort = true;
        if (!result.startsWith("零")) {
          result = "零" + result;
        }
      }
    }
    intValue = Math.floor(intValue / 10000);
    sectionIndex += 1;
  }
  const cents = Math.round((Math.abs(amount) - value) * 100);
  const integerPart = result ? `${result}元` : "";
  if (cents === 0) return `${integerPart}${integerPart ? "整" : ""}`.replace(/^$/, "零元整");
  const jiao = Math.floor(cents / 10);
  const fen = cents % 10;
  const centsText = (jiao > 0 ? digits[jiao] + "角" : "") + (fen > 0 ? (jiao > 0 || !result ? "" : "零") + digits[fen] + "分" : "");
  return `${integerPart}${centsText}`;
}

export function buildIouText(details: IouDetails): string {
  const amountCents = Math.round(details.amountYuan * 100);
  if (amountCents <= 0) throw new Error("请输入有效的借款金额。");
  if (!details.lender.trim() || !details.borrower.trim()) throw new Error("请填写出借人与借款人姓名。");

  const rateLine =
    details.annualRatePercent && details.annualRatePercent > 0
      ? `双方约定借款年利率为 ${details.annualRatePercent}%；利息不超过合同成立时一年期贷款市场报价利率（LPR）四倍的部分受法律保护。`
      : "本笔借款为无息借款，出借人主张逾期还款利息的，可自逾期之日起按 LPR 计算资金占用损失。";

  const amountYuanText = (amountCents / 100).toFixed(2);
  const [year, month, day] = details.loanDate.split("-");
  const lines = [
    "借　条",
    "",
    `今有借款人 ${details.borrower.trim()}${details.borrowerId ? `（身份证号：${details.borrowerId.trim()}）` : ""}，因${details.purpose?.trim() || "个人资金周转"}需要，向出借人 ${details.lender.trim()}${details.lenderId ? `（身份证号：${details.lenderId.trim()}）` : ""} 借到人民币（大写）${formatChineseAmount(details.amountYuan)}（小写：¥${amountYuanText}），`,
    `借款日期为 ${details.loanDate}，约定于 ${details.repaymentDate} 前一次性归还全部借款。`,
    rateLine,
    details.payMethod?.trim()
      ? `本笔借款通过${details.payMethod.trim()}方式一次性交付，相应转账凭证为本借条附件。`
      : "本笔借款通过银行转账方式交付，相应转账凭证为本借条附件。",
    "",
    "借款人（签名并按手印）：＿＿＿＿＿＿＿＿",
    "出借人（签名）：＿＿＿＿＿＿＿＿",
    "",
    `${year} 年 ${month} 月 ${day} 日`,
    "",
    "提示：1. 请借款人当场手写签名并按手印，同时保留身份证复印件；2. 请务必通过可查证的转账方式交付并备注“借款”；3. 逾期还款经催告仍不归还的，出借人可凭本借条与转账凭证依法主张权利。",
  ];
  return lines.join("\n");
}
