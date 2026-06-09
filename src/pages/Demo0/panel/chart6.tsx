import Chart from "@/components/chart";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import type { ComposeOption, BarSeriesOption, GridComponentOption, TooltipComponentOption, LegendComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption>;

export default function Chart6() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/chart6_batch_type.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  return (
    <Chart<Opt>
      use={[BarChart, GridComponent, TooltipComponent, LegendComponent]}
      option={{
        tooltip: { trigger: "axis", backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 } },
        legend: { bottom: 0, textStyle: { fontSize: 10, color: "#6b7280" }, itemWidth: 10, itemHeight: 6 },
        grid: { top: 8, bottom: 35, left: 40, right: 8 },
        xAxis: { type: "category", data: data.batches.map((y: number) => y + "年"),
          axisLabel: { fontSize: 10, color: "#6b7280" } },
        yAxis: { type: "value", axisLabel: { fontSize: 9, color: "#6b7280" },
          splitLine: { lineStyle: { color: "rgba(199,164,106,0.1)" } } },
        series: [
          { name: "新增项目", type: "bar", stack: "total", data: data.new,
            itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: "#fbdf88" }, { offset: 1, color: "#C7A46A" }] },
              borderRadius: [0, 0, 0, 0] }, barWidth: "50%", emphasis: { focus: "series" } },
          { name: "扩展项目", type: "bar", stack: "total", data: data.extension,
            itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: "#5DA6AE" }, { offset: 1, color: "#3d949e" }] } },
            emphasis: { focus: "series" } },
        ],
        animationDuration: 1200, animationEasing: "cubicOut",
      }}
    />
  );
}
