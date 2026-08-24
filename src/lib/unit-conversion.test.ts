import { describe, expect, it } from "vitest";

import { convertUnit, unitCategories } from "@/lib/unit-conversion";

describe("unitCategories", () => {
  it("exposes six everyday categories with labeled units", () => {
    expect(unitCategories.map((category) => category.id)).toEqual([
      "length",
      "weight",
      "temperature",
      "area",
      "volume",
      "speed",
    ]);
    for (const category of unitCategories) {
      expect(category.units.length).toBeGreaterThan(1);
      for (const unit of category.units) {
        expect(unit.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("convertUnit", () => {
  it("converts length through a shared base", () => {
    expect(convertUnit("length", "km", "m", 1.5)).toBeCloseTo(1500);
    expect(convertUnit("length", "li", "m", 1)).toBe(500);
  });

  it("converts weight including Chinese market units", () => {
    expect(convertUnit("weight", "kg", "jin", 1)).toBeCloseTo(2);
    expect(convertUnit("weight", "g", "kg", 500)).toBeCloseTo(0.5);
  });

  it("handles affine temperature conversions", () => {
    expect(convertUnit("temperature", "celsius", "fahrenheit", 100)).toBeCloseTo(212);
    expect(convertUnit("temperature", "celsius", "fahrenheit", 0)).toBeCloseTo(32);
    expect(convertUnit("temperature", "celsius", "kelvin", 25)).toBeCloseTo(298.15);
    expect(convertUnit("temperature", "fahrenheit", "celsius", 98.6)).toBeCloseTo(37);
  });

  it("converts area, volume, and speed", () => {
    expect(convertUnit("area", "hectare", "sqm", 1)).toBeCloseTo(10000);
    expect(convertUnit("volume", "liter", "milliliter", 1.2)).toBeCloseTo(1200);
    expect(convertUnit("speed", "kmh", "mps", 36)).toBeCloseTo(10);
  });

  it("returns null for unknown categories or units", () => {
    expect(convertUnit("unknown", "m", "cm", 1)).toBeNull();
    expect(convertUnit("length", "m", "nonsense", 1)).toBeNull();
  });
});
