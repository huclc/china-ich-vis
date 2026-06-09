import Chart from "@/components/chart";
import { BarChart, PictorialBarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import type { ComposeOption, BarSeriesOption, PictorialBarSeriesOption, GridComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<BarSeriesOption | PictorialBarSeriesOption | GridComponentOption>;

const COLORS = ["#ea580c", "#5DA6AE", "#C7A46A", "#e8734a", "#3d949e",
  "#FF6B6B", "#4ECDC4", "#FF8E72", "#DDA0DD", "#45B7D1"];

export default function Chart3() {
  const [data, setData] = useState<{ name: string; value: number }[] | null>(null);
  useEffect(() => { fetch("/chart3_category_rank.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  const sorted = [...data].reverse();

  return (
    <Chart<Opt>
      use={[BarChart, PictorialBarChart, GridComponent, LabelLayout]}
      option={{
        grid: { top: 0, bottom: 0, left: "20%", right: "12%" },
        xAxis: { show: false },
        yAxis: {
          type: "category", inverse: true, data: sorted.map(d => d.name),
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { fontSize: 11, color: "#1e2529" },
        },
        series: [
          {
            type: "bar", data: sorted.map((d, i) => ({ value: d.value,
              itemStyle: { borderRadius: [0, 4, 4, 0],
                color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [{ offset: 0, color: "#fbdf88" }, { offset: 1, color: COLORS[sorted.length - 1 - i % COLORS.length] }] }
              }
            })),
            barWidth: 8, showBackground: true,
            backgroundStyle: { borderRadius: [0, 4, 4, 0], color: "rgba(199,164,106,0.1)" },
            label: { show: true, position: "right", color: "#ea580c", fontSize: 11, fontWeight: "bold", valueAnimation: true },
          },
          {
            name: "dot", type: "pictorialBar", symbol: "circle", symbolSize: 12,
            z: 12, itemStyle: { color: "#C7A46A", shadowColor: "#C7A46A", shadowBlur: 8 },
            data: sorted.map(d => ({ value: d.value, symbolPosition: "end" })),
          },
        ],
        animationDuration: 1000, animationEasing: "cubicOut",
      }}
    />
  );
}
