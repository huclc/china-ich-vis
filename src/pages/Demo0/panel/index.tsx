import { useEffect } from "react";
import styled from "styled-components";
import AutoFit from "@/components/autoFit";
import NumberAnimation from "@/components/numberAnimation";
import useMoveTo from "@/hooks/useMoveTo";
import Chart1 from "./chart1";
import Chart2 from "./chart2";
import Chart3 from "./chart3";
import Chart4 from "./chart4";
import Chart5 from "./chart5";
import Chart6 from "./chart6";
import Chart7 from "./chart7";
import Chart8 from "./chart8";

/* ========== Warm-tone styled components (ref: Demo1) ========== */
const PanelWrapper = styled.div`
  position: absolute; inset: 0; z-index: 5; pointer-events: none;
  display: flex; flex-direction: column; padding: 10px 20px 20px;
`;

const HeaderBg = styled.svg.attrs({
  xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 1920 72",
  width: "100%", height: "100%", preserveAspectRatio: "none",
})`
  position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1;
`;

const HeaderWrapper = styled.div`
  position: relative; width: 100%; height: 65px; display: flex;
  justify-content: center; align-items: center; flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  font-size: 26px; letter-spacing: 6px; font-weight: 700;
  background: linear-gradient(to bottom, #ea580c, #C7A46A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  text-align: center;
  &::after {
    content: "CHINESE INTANGIBLE CULTURAL HERITAGE · SPATIOTEMPORAL ANALYSIS";
    display: block; font-size: 11px; letter-spacing: 8px; text-align: center;
    color: rgba(199, 164, 106, 0.6); margin-top: -2px;
    -webkit-text-fill-color: rgba(199, 164, 106, 0.6);
  }
`;

const StatRow = styled.div`
  display: flex; gap: 10px; height: 64px; flex-shrink: 0; margin-bottom: 8px;
`;

const StatCard = styled.div`
  flex: 1; position: relative; display: flex; flex-direction: column;
  justify-content: center; align-items: center; pointer-events: auto;
  backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(199, 164, 106, 0.25); border-radius: 4px;
  transition: all 0.3s ease;
  &::before {
    content: ""; position: absolute; top: -1px; left: -1px;
    width: 8px; height: 8px; border-top: 2px solid #C7A46A;
    border-left: 2px solid #C7A46A; transition: all 0.3s ease; pointer-events: none;
  }
  &::after {
    content: ""; position: absolute; bottom: -1px; right: -1px;
    width: 8px; height: 8px; border-bottom: 2px solid #C7A46A;
    border-right: 2px solid #C7A46A; transition: all 0.3s ease; pointer-events: none;
  }
  &:hover::before, &:hover::after { width: 100%; height: 100%; opacity: 0.4; }
  &:hover { border-color: rgba(199, 164, 106, 0.5); box-shadow: 0 0 16px rgba(199, 164, 106, 0.12); }
`;

const StatValue = styled.div`
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 22px; font-weight: 700; color: #1e2529;
`;

const StatLabel = styled.div`
  font-size: 10px; color: #6b7280; margin-top: 1px; letter-spacing: 0.04em;
`;

const GridWrapper = styled.div`
  flex: 1; min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(8, minmax(0, 1fr));
  gap: 12px;
`;

const Card = styled.div`
  position: relative; display: flex; flex-direction: column; pointer-events: auto;
  backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(199, 164, 106, 0.25); border-radius: 4px;
  padding: 10px 12px; overflow: hidden; transition: all 0.3s ease;
  &::before {
    content: ""; position: absolute; top: -1px; left: -1px;
    width: 8px; height: 8px; border-top: 2px solid #C7A46A;
    border-left: 2px solid #C7A46A; transition: all 0.3s ease; pointer-events: none;
  }
  &::after {
    content: ""; position: absolute; bottom: -1px; right: -1px;
    width: 8px; height: 8px; border-bottom: 2px solid #C7A46A;
    border-right: 2px solid #C7A46A; transition: all 0.3s ease; pointer-events: none;
  }
  &:hover::before, &:hover::after { width: 100%; height: 100%; opacity: 0.4; }
  &:hover { border-color: rgba(199, 164, 106, 0.5); box-shadow: 0 0 20px rgba(199, 164, 106, 0.1); }
`;

const CardTitle = styled.div`
  font-size: 13px; margin-bottom: 6px; padding-left: 8px;
  border-left: 3px solid #C7A46A; display: flex; justify-content: space-between; align-items: center;
  color: #1e2529; font-weight: 600; flex-shrink: 0;
  span { font-size: 9px; color: rgba(0, 0, 0, 0.35); font-weight: normal; }
`;

const ChartWrap = styled.div`flex: 1; min-height: 0;`;

export default function Panel() {
  // Staggered animation refs (ref: Demo1)
  const topAnim = useMoveTo<HTMLDivElement>("toBottom", 0.6, 0.3);
  const l1 = useMoveTo<HTMLDivElement>("toRight", 0.7, 0.8);
  const l2 = useMoveTo<HTMLDivElement>("toRight", 0.7, 1.0);
  const l3 = useMoveTo<HTMLDivElement>("toRight", 0.7, 1.2);
  const r1 = useMoveTo<HTMLDivElement>("toLeft", 0.7, 0.8);
  const r2 = useMoveTo<HTMLDivElement>("toLeft", 0.7, 1.0);
  const r3 = useMoveTo<HTMLDivElement>("toLeft", 0.7, 1.2);
  const b1 = useMoveTo<HTMLDivElement>("toTop", 0.7, 1.4);
  const b2 = useMoveTo<HTMLDivElement>("toTop", 0.7, 1.5);

  useEffect(() => {
    // Trigger all entrance animations after map starts
    const timer = setTimeout(() => {
      topAnim.restart(); l1.restart(); l2.restart(); l3.restart();
      r1.restart(); r2.restart(); r3.restart(); b1.restart(); b2.restart();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // SVG header background (ref: Demo1 headder.tsx)
  const headerSvg = (
    <HeaderBg>
      <defs>
        <radialGradient id="hr1" cx="50%" cy="50%" fx="100%" fy="50%" r="50%">
          <stop offset="0%" stopColor="#C7A46A" stopOpacity="1" />
          <stop offset="100%" stopColor="#C7A46A" stopOpacity="0" />
        </radialGradient>
        <mask id="hml">
          <circle r="80" cx="0" cy="0" fill="url(#hr1)">
            <animateMotion begin="0s" dur="3s" repeatCount="indefinite"
              path="M0,50 L560,50 L610,68 L1310,68 L1360,50 L1920,50" rotate="auto" />
          </circle>
        </mask>
        <mask id="hmr">
          <circle r="80" cx="0" cy="0" fill="url(#hr1)">
            <animateMotion begin="0s" dur="3s" repeatCount="indefinite"
              path="M1920,50 L1360,50 L1310,68 L610,68 L560,50 L0,50" rotate="auto" />
          </circle>
        </mask>
      </defs>
      <path d="M0,0 L1920,0 L1920,50 L1360,50 L1310,68 L610,68 L560,50 L0,50 Z" fill="rgba(255, 245, 232, 0.7)" />
      <path d="M0,50 L560,50 L610,68 L1310,68 L1360,50 L1920,50" fill="none" stroke="#C7A46A" strokeWidth="1" />
      <path d="M0,50 L560,50 L610,68 L960,68" fill="none" stroke="#ea580c" strokeWidth="3" mask="url(#hml)" />
      <path d="M1920,50 L1360,50 L1310,68 L960,68" fill="none" stroke="#ea580c" strokeWidth="3" mask="url(#hmr)" />
    </HeaderBg>
  );

  return (
    <AutoFit>
      <PanelWrapper>
        {/* Header */}
        <div ref={topAnim.ref as any} style={{ flexShrink: 0 }}>
          <HeaderWrapper>
            {headerSvg}
            <HeaderTitle>中国非物质文化遗产 · 时空分布可视分析</HeaderTitle>
          </HeaderWrapper>
        </div>

        {/* Stat cards */}
        <StatRow>
          <StatCard><StatValue><NumberAnimation value={3610} duration={2} delay={1.0} /></StatValue><StatLabel>非遗项目总数</StatLabel></StatCard>
          <StatCard><StatValue><NumberAnimation value={3061} duration={2} delay={1.1} /></StatValue><StatLabel>独立项目名称</StatLabel></StatCard>
          <StatCard><StatValue><NumberAnimation value={33} duration={2} delay={1.2} /></StatValue><StatLabel>覆盖省级行政区</StatLabel></StatCard>
          <StatCard><StatValue><NumberAnimation value={10} duration={2} delay={1.3} /></StatValue><StatLabel>非遗十大类别</StatLabel></StatCard>
          <StatCard><StatValue><NumberAnimation value={42} duration={2} delay={1.4} /></StatValue><StatLabel>UNESCO 世界非遗</StatLabel></StatCard>
        </StatRow>

        {/* Chart grid: 4 cols × 8 rows, middle 2 cols empty for 3D map */}
        <GridWrapper>
          {/* Left column */}
          <Card ref={l1.ref} style={{ gridArea: "1 / 1 / 3 / 2" }}>
            <CardTitle>类别结构变迁 <span>CATEGORY TREND</span></CardTitle>
            <ChartWrap><Chart1 /></ChartWrap>
          </Card>
          <Card ref={l2.ref} style={{ gridArea: "3 / 1 / 5 / 2" }}>
            <CardTitle>省份排名 TOP15 <span>PROVINCE RANKING</span></CardTitle>
            <ChartWrap><Chart2 /></ChartWrap>
          </Card>
          <Card ref={l3.ref} style={{ gridArea: "5 / 1 / 7 / 2" }}>
            <CardTitle>十大类别排名 <span>CATEGORY RANKING</span></CardTitle>
            <ChartWrap><Chart3 /></ChartWrap>
          </Card>

          {/* Right column */}
          <Card ref={r1.ref} style={{ gridArea: "1 / 4 / 3 / 5" }}>
            <CardTitle>跨地域非遗 TOP12 <span>MULTI-LOCATION ICH</span></CardTitle>
            <ChartWrap><Chart4 /></ChartWrap>
          </Card>
          <Card ref={r2.ref} style={{ gridArea: "3 / 4 / 5 / 5" }}>
            <CardTitle>区域 × 类别分布 <span>REGION × CATEGORY</span></CardTitle>
            <ChartWrap><Chart5 /></ChartWrap>
          </Card>
          <Card ref={r3.ref} style={{ gridArea: "5 / 4 / 7 / 5" }}>
            <CardTitle>批次新增 vs 扩展 <span>NEW vs EXTENSION</span></CardTitle>
            <ChartWrap><Chart6 /></ChartWrap>
          </Card>

          {/* Bottom row */}
          <Card ref={b1.ref} style={{ gridArea: "7 / 1 / 9 / 3" }}>
            <CardTitle>网络舆论词云 <span>WEIBO WORD CLOUD</span></CardTitle>
            <ChartWrap><Chart7 /></ChartWrap>
          </Card>
          <Card ref={b2.ref} style={{ gridArea: "7 / 3 / 9 / 5" }}>
            <CardTitle>网络情绪分析 <span>SENTIMENT ANALYSIS</span></CardTitle>
            <ChartWrap><Chart8 /></ChartWrap>
          </Card>
        </GridWrapper>
      </PanelWrapper>
    </AutoFit>
  );
}
