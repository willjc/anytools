/**
 * 聚会 AA 结算：按人均分摊，求最少转账次数的结清方案（贪心法）。
 * 金额全程用「分」为单位的整数计算，避免浮点误差。
 */

export type AaEntry = { name: string; paidYuan: number };

export type AaTransfer = { from: string; to: string; cents: number };

export type AaSettlement = {
  totalCents: number;
  shareCents: number;
  balances: { name: string; cents: number }[];
  transfers: AaTransfer[];
};

export function settleAa(entries: AaEntry[]): AaSettlement {
  if (entries.length === 0) {
    return { totalCents: 0, shareCents: 0, balances: [], transfers: [] };
  }
  const totalCents = entries.reduce((sum, entry) => sum + Math.round(entry.paidYuan * 100), 0);
  const shareCents = Math.round(totalCents / entries.length);

  const balances = entries.map((entry) => ({
    name: entry.name,
    cents: Math.round(entry.paidYuan * 100) - shareCents,
  }));

  const creditors = balances.filter((item) => item.cents > 0).map((item) => ({ ...item }));
  const debtors = balances.filter((item) => item.cents < 0).map((item) => ({ ...item }));
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => a.cents - b.cents);

  const transfers: AaTransfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].cents, -debtors[di].cents);
    if (amount > 0) {
      transfers.push({ from: debtors[di].name, to: creditors[ci].name, cents: amount });
    }
    creditors[ci].cents -= amount;
    debtors[di].cents += amount;
    if (creditors[ci].cents === 0) ci += 1;
    if (debtors[di].cents === 0) di += 1;
  }

  return { totalCents, shareCents, balances, transfers };
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
