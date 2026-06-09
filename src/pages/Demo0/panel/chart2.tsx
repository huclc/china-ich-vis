import Chart from "@/components/chart";
import { BarChart, PictorialBarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import type { ComposeOption, BarSeriesOption, PictorialBarSeriesOption, GridComponentOption, TooltipComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<BarSeriesOption | PictorialBarSeriesOption | GridComponentOption | TooltipComponentOption>;

export default function Chart2() {
  const [data, setData] = useState<{ name: string; value: number }[] | null>(null);
  useEffect(() => { fetch("/chart2_province_rank.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  const sorted = [...data].reverse();

  return (
    <Chart<Opt>
      use={[BarChart, PictorialBarChart, GridComponent, TooltipComponent, LabelLayout]}
      option={{
        grid: { top: 0, bottom: 0, left: "8%", right: "12%" },
        tooltip: { trigger: "axis", backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 } },
        xAxis: { show: false },
        yAxis: {
          type: "category", inverse: true, data: sorted.map(d => d.name),
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { fontSize: 11, color: "#1e2529", margin: 8,
            formatter: (_v: string, i: number) => `{a|NO.${sorted.length - i}}  {b|${sorted[i].name}}`,
            rich: { a: { color: "rgba(0,0,0,0.4)", fontSize: 9 }, b: { color: "#1e2529" } }
          },
        },
        series: [
          {
            type: "bar", data: sorted.map(d => d.value),
            barWidth: 8, itemStyle: { borderRadius: [0, 4, 4, 0],
              color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [{ offset: 0, color: "#fbdf88" }, { offset: 1, color: "#ea580c" }] }
            },
            showBackground: true, backgroundStyle: { borderRadius: [0, 4, 4, 0], color: "rgba(199,164,106,0.1)" },
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
