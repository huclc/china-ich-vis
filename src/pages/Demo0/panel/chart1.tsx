import Chart from "@/components/chart";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import type { ComposeOption, LineSeriesOption, GridComponentOption, TooltipComponentOption, LegendComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption>;

const COLORS = ["#ea580c", "#5DA6AE", "#C7A46A", "#e8734a", "#3d949e",
  "#FF6B6B", "#4ECDC4", "#FF8E72", "#DDA0DD", "#45B7D1"];

export default function Chart1() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/chart1_category_trend.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  return (
    <Chart<Opt>
      use={[LineChart, GridComponent, TooltipComponent, LegendComponent]}
      option={{
        tooltip: { trigger: "axis", appendToBody: true, confine: true, backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 } },
        legend: { bottom: 0, textStyle: { fontSize: 9, color: "#6b7280" }, itemWidth: 10, itemHeight: 6, type: "scroll" },
        grid: { top: 8, bottom: 35, left: 40, right: 12 },
        xAxis: { type: "category", data: data.batches.map((y: number) => y + "年"), axisLabel: { fontSize: 9, color: "#6b7280" }, axisLine: { lineStyle: { color: "rgba(199,164,106,0.3)" } } },
        yAxis: { type: "value", name: "%", axisLabel: { fontSize: 9, color: "#6b7280" }, splitLine: { lineStyle: { color: "rgba(199,164,106,0.1)" } } },
        series: data.series.map((s: any, i: number) => ({
          type: "line", name: s.name, data: s.values,
          symbol: "circle", symbolSize: 4,
          lineStyle: { width: 2, color: COLORS[i % COLORS.length] },
          itemStyle: { color: COLORS[i % COLORS.length] },
          emphasis: { focus: "series", lineStyle: { width: 3 } },
        })),
        animationDuration: 1500, animationEasing: "cubicOut",
      }}
    />
  );
}
