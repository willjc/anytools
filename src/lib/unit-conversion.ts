export type UnitDefinition = {
  id: string;
  label: string;
  toBase?: (value: number) => number;
  fromBase?: (value: number) => number;
  factor?: number;
};

export type UnitCategory = {
  id: string;
  label: string;
  units: readonly UnitDefinition[];
};

function linear(id: string, label: string, factor: number): UnitDefinition {
  return { id, label, factor };
}

const celsius: UnitDefinition = {
  id: "celsius",
  label: "摄氏度",
  toBase: (value) => value,
  fromBase: (value) => value,
};

const fahrenheit: UnitDefinition = {
  id: "fahrenheit",
  label: "华氏度",
  toBase: (value) => ((value - 32) * 5) / 9,
  fromBase: (value) => (value * 9) / 5 + 32,
};

const kelvin: UnitDefinition = {
  id: "kelvin",
  label: "开尔文",
  toBase: (value) => value - 273.15,
  fromBase: (value) => value + 273.15,
};

export const unitCategories: readonly UnitCategory[] = [
  {
    id: "length",
    label: "长度",
    units: [
      linear("mm", "毫米", 0.001),
      linear("cm", "厘米", 0.01),
      linear("m", "米", 1),
      linear("km", "千米", 1000),
      linear("inch", "英寸", 0.0254),
      linear("foot", "英尺", 0.3048),
      linear("li", "里", 500),
      linear("mile", "英里", 1609.344),
    ],
  },
  {
    id: "weight",
    label: "重量",
    units: [
      linear("g", "克", 1),
      linear("kg", "千克", 1000),
      linear("t", "吨", 1_000_000),
      linear("liang", "两", 50),
      linear("jin", "斤", 500),
      linear("ounce", "盎司", 28.349523125),
      linear("pound", "磅", 453.59237),
    ],
  },
  {
    id: "temperature",
    label: "温度",
    units: [celsius, fahrenheit, kelvin],
  },
  {
    id: "area",
    label: "面积",
    units: [
      linear("sqm", "平方米", 1),
      linear("sqkm", "平方千米", 1_000_000),
      linear("hectare", "公顷", 10_000),
      linear("mu", "亩", 2000 / 3),
      linear("sqft", "平方英尺", 0.09290304),
    ],
  },
  {
    id: "volume",
    label: "体积",
    units: [
      linear("milliliter", "毫升", 1),
      linear("liter", "升", 1000),
      linear("cubicmeter", "立方米", 1_000_000),
      linear("gallon", "美制加仑", 3785.411784),
    ],
  },
  {
    id: "speed",
    label: "速度",
    units: [
      linear("mps", "米/秒", 1),
      linear("kmh", "千米/小时", 5 / 18),
      linear("mph", "英里/小时", 0.44704),
      linear("knot", "节", 0.514444),
    ],
  },
];

export function convertUnit(categoryId: string, fromUnitId: string, toUnitId: string, value: number): number | null {
  const category = unitCategories.find((item) => item.id === categoryId);
  if (!category || !Number.isFinite(value)) return null;

  const fromUnit = category.units.find((unit) => unit.id === fromUnitId);
  const toUnit = category.units.find((unit) => unit.id === toUnitId);
  if (!fromUnit || !toUnit) return null;

  const baseValue = fromUnit.toBase ? fromUnit.toBase(value) : value * (fromUnit.factor ?? 1);
  return toUnit.fromBase ? toUnit.fromBase(baseValue) : baseValue / (toUnit.factor ?? 1);
}
