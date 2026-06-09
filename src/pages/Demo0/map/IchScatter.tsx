import { useEffect, useMemo, useState } from "react";
import { BufferGeometry, BufferAttribute, CanvasTexture } from "three";
import type { GeoProjection } from "d3-geo";

/** 10-category color palette — soft, visible on satellite terrain */
const CATEGORY_COLORS: Record<string, string> = {
  "民间文学": "#FF6B6B",
  "传统音乐": "#4ECDC4",
  "传统舞蹈": "#FF8E72",
  "传统戏剧": "#E0619E",
  "曲艺": "#7B68EE",
  "传统体育、游艺与杂技": "#45B7D1",
  "传统美术": "#F7CA3E",
  "传统技艺": "#6BCB8B",
  "传统医药": "#DDA0DD",
  "民俗": "#FF9F43",
};

interface ScatterDataItem {
  lng: number;
  lat: number;
  category: string;
}

/** Tiny soft-circle texture generated once */
function createDotTexture(): CanvasTexture {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.15, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface IchScatterProps {
  projection: GeoProjection;
}

export default function IchScatter({ projection }: IchScatterProps) {
  const [data, setData] = useState<ScatterDataItem[] | null>(null);
  const dotTexture = useMemo(() => createDotTexture(), []);

  // Load scatter data
  useEffect(() => {
    fetch("/ich_scatter.json")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(console.error);
  }, []);

  // Group by category, project coordinates
  const groups = useMemo(() => {
    if (!data) return new Map<string, Float32Array[]>();
    const map = new Map<string, Float32Array[]>();
    for (const item of data) {
      const projected = projection([item.lng, item.lat]);
      if (!projected) continue;
      map.has(item.category) || map.set(item.category, []);
      map.get(item.category)!.push(new Float32Array([projected[0], -projected[1], 1.2]));
    }
    return map;
  }, [data, projection]);

  if (!data) return null;

  return (
    <group renderOrder={1}>
      {Array.from(groups.entries()).map(([category, positions]) => {
        const color = CATEGORY_COLORS[category] || "#cccccc";
        const geo = new BufferGeometry();
        const flat = new Float32Array(positions.length * 3);
        for (let i = 0; i < positions.length; i++) {
          flat.set(positions[i], i * 3);
        }
        geo.setAttribute("position", new BufferAttribute(flat, 3));
        return (
          <points key={category} geometry={geo} renderOrder={1}>
            <pointsMaterial
              map={dotTexture}
              color={color}
              size={0.85}
              sizeAttenuation
              depthTest={false}
              depthWrite={false}
              transparent
              opacity={0.9}
            />
          </points>
        );
      })}
    </group>
  );
}
