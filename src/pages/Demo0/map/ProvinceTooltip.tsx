import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import styled from "styled-components";

const Card = styled.div`
  background: rgba(255, 245, 232, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(234, 88, 12, 0.3);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  transform: scale(0.5);
  transform-origin: top center;
`;

const Title = styled.div`
  font-weight: bold;
  font-size: 13px;
  color: #ea580c;
  margin-bottom: 2px;
  text-align: center;
`;

const TotalRow = styled.div`
  text-align: center;
  font-size: 11px;
  color: #5a4a42;
  margin-top: 4px;
  span { font-weight: bold; color: #ea580c; font-size: 13px; }
`;

interface Props {
  provinceName: string;
  position: [number, number, number];
  visible: boolean;
}

export default function ProvinceTooltip({ provinceName, position, visible }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<Record<string, number> | null>(null);

  // Fetch data when province changes
  useEffect(() => {
    if (!visible) return;
    fetch("/province_year_data.json")
      .then((r) => r.json())
      .then((d) => setData(d[provinceName] || null))
      .catch(() => setData(null));
  }, [visible, provinceName]);

  // Init chart when DOM becomes visible (needs dimensions)
  useEffect(() => {
    if (!visible || !chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    if (data) {
      const years = Object.keys(data).sort();
      const values = years.map((y) => data[y]);
      chartInstance.current.setOption({
        grid: { left: 38, right: 6, top: 14, bottom: 20 },
        xAxis: { type: "category", data: years, axisLabel: { color: "#5a4a42", fontSize: 9 } },
        yAxis: { type: "value", axisLabel: { color: "#5a4a42", fontSize: 9 }, splitLine: { lineStyle: { color: "rgba(234,88,12,0.1)" } } },
        series: [{
          type: "bar", data: values,
          color: { type: "linear", y: 0, y2: 1, colorStops: [{ offset: 0, color: "#fbdf88" }, { offset: 1, color: "#ea580c" }] },
          barMaxWidth: 18, itemStyle: { borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: "top", fontSize: 9, color: "#5a4a42", fontWeight: "bold" },
        }],
      });
    }
    return () => { chartInstance.current?.dispose(); chartInstance.current = null; };
  }, [visible, data]);

  return (
    <Html center position={position} distanceFactor={100} zIndexRange={[500, 1000]} style={{ pointerEvents: "none", visibility: visible ? "visible" : "hidden" }}>
      <Card>
        <Title>{provinceName}</Title>
        <div ref={chartRef} style={{ width: 170, height: 110 }} />
        {data && (
          <TotalRow>
            总计: <span>{Object.values(data).reduce((a, b) => a + b, 0)}</span> 项
          </TotalRow>
        )}
      </Card>
    </Html>
  );
}
