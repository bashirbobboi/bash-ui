"use client";
import { IncomeSpendingChart } from "./income-spending-chart";
import { years } from "./fixtures";
export default function FinancialHistoryPreview() { return <IncomeSpendingChart years={years} />; }
