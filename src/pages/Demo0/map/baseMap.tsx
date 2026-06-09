import { Fragment, useMemo, useRef, useState } from "react";
import { Billboard, Box, Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Box2, BufferGeometry, DoubleSide, Line as ThreeLine,
  LineBasicMaterial, RepeatWrapping, Shape, Vector2, Vector3,
} from "three";
import ShapeBox from "./shape";
import ProvinceTooltip from "./ProvinceTooltip";
import IchHeatmap from "./IchHeatmap";
import { useProvinceStore } from "@/stores/useProvinceStore";
import type { GeoProjection } from "d3-geo";
import type { CityGeoJSON } from "@/types/map";
import chinaMapData from "@/assets/china.json";
import satelliteUrl from "@/assets/china_satellite.png";
import normalUrl from "@/assets/china_normal.png";
import displacementUrl from "@/assets/china_displacement.png";

const data = chinaMapData as CityGeoJSON;

const ichData: Record<string, number> = {
  "浙江省": 257, "山东省": 186, "山西省": 182, "广东省": 164, "北京市": 164,
  "河北省": 162, "江苏省": 161, "贵州省": 159, "四川省": 153, "新疆维吾尔自治区": 149,
  "福建省": 146, "云南省": 145, "湖北省": 145, "湖南省": 137, "河南省": 125,
  "内蒙古自治区": 106, "西藏自治区": 105, "安徽省": 99, "陕西省": 91, "青海省": 88,
  "江西省": 88, "甘肃省": 83, "辽宁省": 76, "上海市": 76, "广西壮族自治区": 71,
  "吉林省": 55, "重庆市": 53, "天津市": 47, "海南省": 44, "黑龙江省": 42,
  "宁夏回族自治区": 28, "香港特别行政区": 12, "澳门特别行政区": 11,
};

const MAX_ICH = 257;
const MAX_BAR = 12;
const MIN_BAR = 1.8;

function getBarHeight(value: number): number {
  if (value === 0) return 0.5;
  return MIN_BAR + (value / MAX_ICH) * (MAX_BAR - MIN_BAR);
}

function getBarColor(value: number): string {
  if (value >= 200) return "#C7A46A";
  if (value >= 150) return "#e8734a";
  if (value >= 100) return "#5DA6AE";
  if (value >= 50) return "#3d949e";
  return "#80bec5";
}

/** Animated bar with pulsing glow (like Demo1) */
function ICHBar({ x, y, z, height, color, isHovered }: {
  x: number; y: number; z: number; height: number; color: string; isHovered: boolean;
}) {
  const ref = useRef<any>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame((_, delta) => {
    if (ref.current?.material) {
      phase.current += delta * 0.8;
      const pulse = 0.35 + Math.sin(phase.current) * 0.2;
      ref.current.material.emissiveIntensity = isHovered ? 0.9 : pulse;
    }
  });
  return (
    <group position={[x, y, z + height / 2 + 0.02]}>
      <Box args={[0.55, 0.55, height]} ref={ref}>
        <meshStandardMaterial
          color={isHovered ? "#ffffff" : color}
          metalness={0.3} roughness={0.4}
          emissive={color} emissiveIntensity={0.35}
        />
      </Box>
    </group>
  );
}

export default function BaseMap({ projection }: { projection: GeoProjection }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedProvince = useProvinceStore((s) => s.selectedProvince);
  const selectProvince = useProvinceStore((s) => s.selectProvince);

  const [terrainMap, normalMap, displacementMap] = useTexture(
    [satelliteUrl, normalUrl, displacementUrl],
    (tex) => tex.forEach((el) => { el.wrapS = el.wrapT = RepeatWrapping; })
  );

  const { regions, bbox } = useMemo(() => {
    const regions: { name: string; center: Vector3; points: Vector2[][]; value: number }[] = [];
    const bbox = new Box2();
    const toV2 = (coord: number[]) => {
      const [x, y] = projection(coord as [number, number])!;
      const projected = new Vector2(x, -y);
      bbox.expandByPoint(projected);
      return projected;
    };
    data.features.forEach((feature) => {
      try {
        const centroid = feature.properties.centroid || feature.properties.center;
        if (!centroid || !centroid[0]) return;
        const projected = projection(centroid as [number, number]);
        if (!projected) return;
        const [x, y] = projected;
        const raw: any = feature.geometry.coordinates;
        const rings: any[] = Array.isArray(raw[0][0][0]) ? raw : [raw];
        const points = rings.reduce<Vector2[][]>(
          (pre: Vector2[][], cur: any) => [...pre, ...cur.map((c: any) => c.map(toV2))], []
        );
        if (points.length === 0) return;
        const name = feature.properties.name;
        regions.push({ name, center: new Vector3(x, -y), points, value: ichData[name] || 0 });
      } catch (e) { /* skip */ }
    });
    return { regions, bbox };
  }, [projection]);

  return (
    <group renderOrder={0} position={[0, 0, 0.51]}>
      {regions.map((reg, i) => {
        const isHovered = hovered === reg.name;
        const barH = getBarHeight(reg.value);
        const barColor = getBarColor(reg.value);
        const labelZ = barH + 1.0;
        const floatZ = isHovered ? 1.2 : 0;

        // Border lines (white, depthTest off)
        const borderLines = useMemo(() => {
          return reg.points.map(ring => {
            const pts = ring.map(v => new Vector3(v.x, v.y, 0));
            const geo = new BufferGeometry().setFromPoints(pts);
            const mat = new LineBasicMaterial({ color: "#ffd700", depthTest: false, transparent: true, opacity: 0.85 });
            return new ThreeLine(geo, mat);
          });
        }, [reg.points]);

        return (
          <Fragment key={i}>
            {/* Gray side walls: short, at terrain base level */}
            <mesh position={[0, 0, 0]}>
              <extrudeGeometry
                args={[reg.points.map((e) => new Shape(e)), { depth: floatZ + 0.35, bevelEnabled: false }]}
              />
              <meshStandardMaterial color="#909090" metalness={0.15} roughness={0.65} side={DoubleSide} />
            </mesh>

            {/* Province terrain - flat ShapeGeometry with displacement */}
            <ShapeBox
              bbox={bbox}
              args={[reg.points.map((e) => new Shape(e))]}
              position={[0, 0, floatZ + 0.05]}
              onPointerOver={(e: any) => { e.stopPropagation(); setHovered(reg.name); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { setHovered(null); document.body.style.cursor = "default"; }}
              onClick={(e: any) => { e.stopPropagation(); selectProvince(selectedProvince === reg.name ? null : reg.name); }}
            >
              <meshStandardMaterial
                map={terrainMap}
                normalMap={normalMap}
                displacementMap={displacementMap}
                displacementScale={3.0}
                displacementBias={0}
                color="#ffffff"
                metalness={0.2}
                roughness={0.5}
                side={DoubleSide}
              />
            </ShapeBox>

            {/* ICH Bar */}
            <ICHBar x={reg.center.x} y={reg.center.y} z={floatZ}
              height={barH} color={barColor} isHovered={isHovered} />

            {/* White border lines */}
            <group position={[0, 0, floatZ + 0.15]}>
              {borderLines.map((lineObj, ri) => (
                <primitive key={ri} object={lineObj} />
              ))}
            </group>

            {/* Labels: province name always, count only on hover (like Demo1) */}
            <group position={[0, 0, labelZ + floatZ]}>
              <Billboard position={reg.center}>
                <Text
                  color={isHovered ? "#ffffff" : "#3a2a1a"}
                  fontSize={isHovered ? 2.2 : 1.6}
                  fontWeight={isHovered ? 800 : 600}
                  outlineColor={isHovered ? "#000000" : "#ffffff"}
                  outlineWidth={isHovered ? 0.12 : 0.08}
                  anchorY="bottom"
                >
                  {isHovered ? `${reg.name}  ${reg.value}项` : reg.name}
                </Text>
              </Billboard>
            </group>

            {/* Hover tooltip card - positioned relative to province center (like Demo1) */}
            <group position={[reg.center.x, reg.center.y, labelZ + floatZ + 2]}>
              <ProvinceTooltip
                provinceName={reg.name}
                position={[0, 0, 0]}
                visible={isHovered}
              />
            </group>
          </Fragment>
        );
      })}
      {/* ICH density heatmap */}
      <IchHeatmap projection={projection} position={[0, 0, 2.2]} />
    </group>
  );
}
