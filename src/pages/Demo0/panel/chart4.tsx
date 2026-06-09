import Chart from "@/components/chart";
import { BarChart, PictorialBarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import type { ComposeOption, BarSeriesOption, PictorialBarSeriesOption, GridComponentOption, TooltipComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<BarSeriesOption | PictorialBarSeriesOption | GridComponentOption | TooltipComponentOption>;

export default function Chart4() {
  const [data, setData] = useState<{ name: string; locations: number; provinces: number }[] | null>(null);
  useEffect(() => { fetch("/chart4_multiloc.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  const sorted = [...data].reverse();

  return (
    <Chart<Opt>
      use={[BarChart, PictorialBarChart, GridComponent, TooltipComponent, LabelLayout]}
      option={{
        grid: { top: 0, bottom: 0, left: "8%", right: "12%" },
        tooltip: { trigger: "axis", backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 },
          formatter: (p: any) => `${p[0].name}<br/>${p[0].value} 个地点 · 跨 ${sorted[sorted.length-1-p[0].dataIndex].provinces} 省` },
        xAxis: { show: false },
        yAxis: {
          type: "category", inverse: true, data: sorted.map(d => d.name),
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { fontSize: 10, color: "#1e2529" },
        },
        series: [
          {
            type: "bar", data: sorted.map(d => d.locations),
            barWidth: 8, itemStyle: { borderRadius: [0, 4, 4, 0],
              color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [{ offset: 0, color: "#5DA6AE" }, { offset: 1, color: "#3d949e" }] }
            },
            showBackground: true, backgroundStyle: { borderRadius: [0, 4, 4, 0], color: "rgba(93,166,174,0.1)" },
            label: { show: true, position: "right", color: "#5DA6AE", fontSize: 11, fontWeight: "bold", valueAnimation: true,
              formatter: (p: any) => `${p.value} 地` },
          },
          {
            name: "dot", type: "pictorialBar", symbol: "circle", symbolSize: 10,
            z: 12, itemStyle: { color: "#5DA6AE", shadowColor: "#5DA6AE", shadowBlur: 6 },
            data: sorted.map(d => ({ value: d.locations, symbolPosition: "end" })),
          },
        ],
        animationDuration: 1000, animationEasing: "cubicOut",
      }}
    />
  );
}
