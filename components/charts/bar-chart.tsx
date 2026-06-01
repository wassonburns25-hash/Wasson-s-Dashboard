"use client";

import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export function IncomeBarChart({
  data,
  emptyText = "No income data yet.",
}: {
  data: { label: string; total: number }[];
  emptyText?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RBarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(v: number) => [formatCurrency(v), "Income"]}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="hsl(var(--primary))" />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
