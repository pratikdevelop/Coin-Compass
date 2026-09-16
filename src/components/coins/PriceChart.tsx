import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/format";

export type Range = "1D" | "7D" | "30D" | "90D" | "1Y" | "MAX";
export const RANGES: Range[] = ["1D", "7D", "30D", "90D", "1Y", "MAX"];

export function PriceChart({
  points,
  range,
  positive,
}: {
  points: { timestamp: number; price: number }[];
  range: Range;
  positive: boolean;
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        t: p.timestamp * 1000,
        price: p.price,
      })),
    [points],
  );

  const stroke = positive ? "var(--color-gain)" : "var(--color-loss)";

  function labelFor(t: number) {
    const d = new Date(t);
    if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (range === "1Y" || range === "MAX")
      return d.toLocaleDateString([], { month: "short", year: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="h-[300px] w-full sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={labelFor}
            minTickGap={40}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={78}
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-popover-foreground)",
              fontSize: 12,
            }}
            labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
            formatter={(v: number | string) => [formatPrice(Number(v)), "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
