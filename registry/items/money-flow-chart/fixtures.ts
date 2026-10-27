import type { FundFlow } from "./money-flow-chart";
export const flows: FundFlow[] = [
  {
    label: "FY25", periodEnd: "2025-03-31", headline: "Income exceeded spending by £22k.",
    total: 1680000, governmentIncome: 420000, incomeIsTotalOnly: false, spendIsTotalOnly: false, incomeDrift: 0, spendDrift: 0,
    inflows: [
      { id: "in:donations", label: "Donations and legacies", amount: 850000, kind: "filed" },
      { id: "in:activities", label: "Charitable activities", amount: 620000, kind: "filed" },
      { id: "in:trading", label: "Trading", amount: 150000, kind: "filed" },
      { id: "in:investment", label: "Investments", amount: 60000, kind: "filed" },
    ],
    outflows: [
      { id: "out:activities", label: "Charitable activities", amount: 1420000, kind: "filed" },
      { id: "out:fundraising", label: "Raising funds", amount: 238000, kind: "filed" },
      { id: "out:surplus", label: "Kept for future work", amount: 22000, kind: "surplus" },
    ],
    incomeDetail: [{ label: "Government grants", amount: 420000 }],
    spendDetail: [{ label: "Grants to institutions", amount: 180000, within: "Charitable activities" }],
  },
  {
    label: "FY24", periodEnd: "2024-03-31", headline: "Spending exceeded income by £28k.",
    total: 1598000, governmentIncome: 390000, incomeIsTotalOnly: false, spendIsTotalOnly: false, incomeDrift: 0, spendDrift: 0,
    inflows: [
      { id: "in:donations", label: "Donations and legacies", amount: 800000, kind: "filed" },
      { id: "in:activities", label: "Charitable activities", amount: 600000, kind: "filed" },
      { id: "in:trading", label: "Trading and investments", amount: 170000, kind: "filed" },
      { id: "in:reserves", label: "Drawn from reserves", amount: 28000, kind: "reserves" },
    ],
    outflows: [
      { id: "out:activities", label: "Charitable activities", amount: 1360000, kind: "filed" },
      { id: "out:fundraising", label: "Raising funds", amount: 238000, kind: "filed" },
    ],
    incomeDetail: [{ label: "Government grants", amount: 390000 }], spendDetail: [],
  },
];
