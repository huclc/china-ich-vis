import Chart from "@/components/chart";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import type { ComposeOption, PieSeriesOption, TooltipComponentOption, LegendComponentOption } from "echarts";
import { useEffect, useState } from "react";
import styled from "styled-components";
import NumberAnimation from "@/components/numberAnimation";

type Opt = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>;

const Wrapper = styled.div`
  width: 100%; height: 100%; display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px; padding: 8px;
`;
const StatBox = styled.div`
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 8px;
`;
const StatLabel = styled.div`font-size: 10px; color: #6b7280;`;
const StatNum = styled(NumberAnimation)`
  font-size: 24px; font-weight: 700; font-family: "JetBrains Mono", "Consolas", monospace;
`;

export default function Chart8() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/weibo_analysis_deepseek.json")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);
  if (!data) return null;

  const { positive, neutral, negative, positive_pct, neutral_pct } = data.sentiment;

  return (
    <Wrapper>
      <StatBox>
        <StatNum value={positive} options={{ maximumFractionDigits: 0 }} style={{ color: "#5DA6AE" }} />
        <StatLabel>正面 ({positive_pct}%)</StatLabel>
      </StatBox>
      <StatBox>
        <StatNum value={neutral} options={{ maximumFractionDigits: 0 }} style={{ color: "#C7A46A" }} />
        <StatLabel>中性 ({neutral_pct}%)</StatLabel>
      </StatBox>
      <div style={{ gridColumn: "1 / 3" }}>
        <Chart<Opt>
          use={[PieChart, TooltipComponent, LegendComponent, LabelLayout]}
          option={{
            tooltip: { trigger: "item", backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c", textStyle: { color: "#1e2529", fontSize: 11 } },
            legend: { show: false },
            series: [{
              type: "pie", radius: ["55%", "78%"], center: ["50%", "55%"],
              avoidLabelOverlap: false, itemStyle: { borderRadius: 4, borderColor: "#f5f0e8", borderWidth: 2 },
              label: { show: true, position: "outside", fontSize: 9, color: "#6b7280",
                formatter: "{b}\n{d}%" },
              emphasis: { label: { fontSize: 14, fontWeight: "bold" }, scaleSize: 8 },
              data: [
                { value: positive, name: "正面", itemStyle: { color: "#5DA6AE" } },
                { value: neutral, name: "中性", itemStyle: { color: "#C7A46A" } },
                { value: negative, name: "负面", itemStyle: { color: "#ea580c" } },
              ],
            }],
            animationDuration: 1500, animationEasing: "cubicOut",
          }}
        />
      </div>
    </Wrapper>
  );
}
