"use client";

import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export function WeightChart({
  data,
  goal,
}: {
  data: { label: string; weight: number }[];
  goal: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Log your weight to see the trend toward your goal.
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights, goal) - 3;
  const max = Math.max(...weights, goal) + 3;

  return (
    <ResponsiveContainer width="100%" height={224}>
      <RLineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          domain={[Math.floor(min), Math.ceil(max)]}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(v: number) => [`${v} lb`, "Weight"]}
        />
        <ReferenceLine
          y={goal}
          stroke="hsl(var(--primary))"
          strokeDasharray="4 4"
          label={{
            value: `Goal ${goal}`,
            fontSize: 11,
            fill: "hsl(var(--primary))",
            position: "insideTopRight",
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </RLineChart>
    </ResponsiveContainer>
  );
}
