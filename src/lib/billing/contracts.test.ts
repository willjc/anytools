import { describe, expect, it } from "vitest";

import { validateMoney } from "@/lib/billing/contracts";

describe("validateMoney", () => {
  it("accepts a positive CNY fen amount", () => {
    expect(validateMoney({ currency: "CNY", amountFen: 100 })).toEqual({ currency: "CNY", amountFen: 100 });
  });

  it("rejects zero, fractions, and negative values", () => {
    expect(() => validateMoney({ currency: "CNY", amountFen: 0 })).toThrow("positive integer");
    expect(() => validateMoney({ currency: "CNY", amountFen: 1.5 })).toThrow("positive integer");
    expect(() => validateMoney({ currency: "CNY", amountFen: -1 })).toThrow("positive integer");
  });
});
