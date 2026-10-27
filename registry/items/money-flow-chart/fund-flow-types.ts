export type FlowDetail = { label: string; amount: number; within?: string | null };
export type FlowBand = {
  
  id: string;
  label: string;
  amount: number;
  
  kind: "filed" | "surplus" | "reserves";
  
  government?: boolean;
};

export type FundFlow = {
  
  label: string;
  periodEnd: string;
  
  headline: string;
  
  inflows: FlowBand[];
  
  outflows: FlowBand[];
  
  total: number;
  
  governmentIncome: number | null;
  
  incomeDetail: FlowDetail[];
  spendDetail: FlowDetail[];
  
  incomeIsTotalOnly: boolean;
  spendIsTotalOnly: boolean;
  
  incomeDrift: number;
  spendDrift: number;
};

