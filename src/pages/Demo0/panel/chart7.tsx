import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import "echarts-wordcloud";

/** Word cloud chart — uses full echarts (not tree-shaken) for wordcloud extension */
export default function Chart7() {
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const [data, setData] = useState<{ name: string; value: number }[] | null>(null);

  useEffect(() => {
    fetch("/weibo_wordfreq.json")
      .then(r => r.json())
      .then(d => setData(d.slice(0, 80)))
      .catch(() => setData([]));
  }, []);

  useEffect(() => {
    if (!data || !boxRef.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(boxRef.current);
    }
    const colors = ["#ea580c", "#5DA6AE", "#C7A46A", "#e8734a", "#3d949e",
      "#FF6B6B", "#4ECDC4", "#DDA0DD", "#FF8E72", "#45B7D1"];

    chartRef.current.setOption({
      tooltip: {
        backgroundColor: "rgba(255,245,232,0.9)", borderColor: "#ea580c",
        textStyle: { color: "#1e2529", fontSize: 11 },
      },
      series: [{
        type: "wordCloud",
        shape: "circle",
        width: "100%", height: "100%",
        sizeRange: [12, 42],
        rotationRange: [-30, 30],
        rotationStep: 15,
        gridSize: 5,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          fontWeight: "normal",
          color: () => colors[Math.floor(Math.random() * colors.length)],
        },
        emphasis: { focus: "self", shadowBlur: 8, shadowColor: "rgba(234,88,12,0.6)" },
        data: data.map(d => ({ name: d.name, value: d.value })),
      }],
    });
  }, [data]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); chartRef.current?.dispose(); };
  }, []);

  return <div ref={boxRef} style={{ width: "100%", height: "100%" }} />;
}
