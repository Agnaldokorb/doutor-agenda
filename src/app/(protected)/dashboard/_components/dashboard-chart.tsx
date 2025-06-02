"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

// Cores modernas para as barras
const COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
];

// Tooltip customizado
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-blue-600">
          <span className="font-medium">{value}</span>{" "}
          <span className="text-gray-600">
            {value === 1 ? "agendamento" : "agendamentos"}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            fontWeight={500}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b" }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            fontWeight={500}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b" }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: "rgba(59, 130, 246, 0.1)",
            }}
          />
          <Bar dataKey="total" radius={6} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Estatísticas resumidas */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex flex-col items-center rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
          >
            <div
              className="mb-2 h-4 w-4 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs font-medium tracking-wide text-gray-600 uppercase">
              {item.name}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
