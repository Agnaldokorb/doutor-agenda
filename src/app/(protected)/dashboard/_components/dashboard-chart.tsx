"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`${value} pacientes`, "Total"]}
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
        />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
          stackId="a"
        />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          className="fill-blue-500"
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
