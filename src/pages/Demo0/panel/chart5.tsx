import Chart from "@/components/chart";
import { HeatmapChart } from "echarts/charts";
import { GridComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import type { ComposeOption, HeatmapSeriesOption, GridComponentOption, TooltipComponentOption, VisualMapComponentOption } from "echarts";
import { useEffect, useState } from "react";

type Opt = ComposeOption<HeatmapSeriesOption | GridComponentOption | TooltipComponentOption | VisualMapComponentOption>;

export default function Chart5() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/chart5_region_heatmap.json").then(r => r.json()).then(setData); }, []);
  if (!data) return null;

  const heatData: [number, number, number][] = [];
  for (let ri = 0; ri < data.regions.length; ri++) {
    for (let ci = 0; ci < data.categories.length; ci++) {
      heatData.push([ci, ri, data.data[ri][ci]]);
    }
  }

  return (
    <Chart<Opt>
      use={[HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent]}
      option={{
        tooltip: { backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 } },
        grid: { top: 0, bottom: 40, left: 55, right: 0 },
        xAxis: { type: "category", data: data.categories, position: "bottom",
          axisLabel: { fontSize: 8, color: "#6b7280", rotate: 30 }, axisLine: { lineStyle: { color: "rgba(199,164,106,0.2)" } } },
        yAxis: { type: "category", data: data.regions,
          axisLabel: { fontSize: 10, color: "#1e2529" }, axisLine: { lineStyle: { color: "rgba(199,164,106,0.2)" } } },
        visualMap: { min: 0, max: Math.max(...heatData.map(d => d[2])),
          orient: "horizontal", bottom: 0, left: "center",
          inRange: { color: ["#fdf2e3", "#fbdf88", "#ea580c", "#9a3412"] },
          textStyle: { fontSize: 8, color: "#6b7280" }, itemWidth: 10, itemHeight: 60 },
        series: [{ type: "heatmap", data: heatData, label: { show: true, fontSize: 8, color: "#1e2529" },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(234,88,12,0.5)" } } }],
        animationDuration: 1500, animationEasing: "cubicOut",
      }}
    />
  );
}
