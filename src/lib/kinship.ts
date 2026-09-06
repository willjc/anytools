/**
 * 亲戚称呼计算封装（基于 mumuy/relationship.js，MIT 协议）。
 * 正向：关系链 → 称呼；解释：称呼 → 关系链。异常一律返回空数组。
 */

import relationship from "relationship.js";

export type KinshipSex = "male" | "female";

/** 关系链选择器可用词（与 relationship.js 词法一致） */
export const KINSHIP_TOKENS = ["爸爸", "妈妈", "哥哥", "姐姐", "弟弟", "妹妹", "儿子", "女儿", "丈夫", "妻子"] as const;

const MAX_CHAIN_LENGTH = 80;

function sexCode(sex: KinshipSex): 0 | 1 {
  return sex === "male" ? 1 : 0;
}

/** 关系链（如“爸爸的姐姐的儿子”）→ 我的称呼列表。 */
export function kinshipFromChain(chain: string, sex: KinshipSex): string[] {
  const text = chain.replace(/\s+/g, "").slice(0, MAX_CHAIN_LENGTH);
  if (!text) return [];
  try {
    const result = relationship({ text, target: "", sex: sexCode(sex) }) as string[];
    return Array.isArray(result) ? result.filter((item) => typeof item === "string" && item) : [];
  } catch {
    return [];
  }
}

/** 称呼（如“舅公”）→ 可能的关系链解释列表。 */
export function kinshipChainFromTerm(term: string): string[] {
  const text = term.replace(/\s+/g, "").slice(0, MAX_CHAIN_LENGTH);
  if (!text) return [];
  try {
    const result = relationship({ text, type: "chain", sex: 1 }) as string[];
    return Array.isArray(result) ? result.filter((item) => typeof item === "string" && item) : [];
  } catch {
    return [];
  }
}

/** 拼接关系链：用于链式选择器。 */
export function appendChainToken(chain: string, token: string): string {
  const next = `${chain}${chain ? "的" : ""}${token}`;
  return next.length > MAX_CHAIN_LENGTH ? chain : next;
}

export function removeLastToken(chain: string): string {
  const index = chain.lastIndexOf("的");
  if (index < 0) return "";
  return chain.slice(0, index);
}
