/** relationship.js（mumuy/relationship，MIT）的类型声明 */
declare module "relationship.js" {
  interface RelationshipOptions {
    /** 关系链（如“爸爸的哥哥”）或称呼（如“大爷”） */
    text?: string;
    /** 目标人物称呼，默认“我” */
    target?: string;
    /** 我的性别：1 男，0 女 */
    sex?: 0 | 1;
    /** default：返回称呼；chain：返回关系链；pair：返回两人关系 */
    type?: "default" | "chain" | "pair";
    /** true 时反向计算：对方怎么称呼我 */
    reverse?: boolean;
    /** 计算最短关系 */
    optimal?: boolean;
  }

  export default function relationship(options: RelationshipOptions): string[];
}
