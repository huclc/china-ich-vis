import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, DoubleSide, ShaderMaterial, type Mesh, type PlaneGeometry } from "three";
import type { GeoProjection } from "d3-geo";
import type { ThreeElements } from "@react-three/fiber";
// @ts-ignore
import heatmapJs from "keli-heatmap.js";

const texCache = new Map<string, CanvasTexture>();
const CANVAS = 800;

interface Props extends Omit<ThreeElements["group"], "visible"> {
  projection: GeoProjection;
}

export default function IchHeatmap({ projection, ...props }: Props) {
  const refMesh = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null!);
  const mountedRef = useRef(true);
  const unis = useRef({
    heatMap: { value: null as CanvasTexture | null },
    greyMap: { value: null as CanvasTexture | null },
    z_scale: { value: 5.0 },
    u_opacity: { value: 0.7 },
  });

  // Dynamically computed plane extent from actual projection
  const [planeExt, setPlaneExt] = useState(0);

  // Stable material — vertex shader with greyMap displacement (Demo1 pattern)
  const material = useMemo(() => new ShaderMaterial({
    transparent: true, side: DoubleSide,
    depthTest: false, depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      uniform float z_scale;
      uniform sampler2D greyMap;
      void main() {
        vUv = uv;
        float h = texture2D(greyMap, uv).r;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * h * z_scale, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D heatMap;
      uniform float u_opacity;
      void main() {
        vec4 c = texture2D(heatMap, vUv);
        gl_FragColor = vec4(c.rgb, c.a * u_opacity);
      }
    `,
    uniforms: unis.current,
  }), []);

  useEffect(() => {
    mountedRef.current = true;
    const ck = "ich_heatmap";

    // Reuse cached textures
    if (texCache.has(ck + "_color") && texCache.has(ck + "_grey")) {
      unis.current.heatMap.value = texCache.get(ck + "_color")!;
      unis.current.greyMap.value = texCache.get(ck + "_grey")!;
      return () => { mountedRef.current = false; };
    }

    const container = document.createElement("div");
    container.style.cssText = "position:absolute;top:-9999px;left:-9999px;";
    document.body.appendChild(container);

    const colorHm = heatmapJs.create({
      container,
      gradient: {
        0.25: "rgba(93,166,174,0)", 0.45: "#5DA6AE",
        0.60: "#C7A46A", 0.75: "#fbdf88",
        0.88: "#ea580c", 1.00: "#9a3412",
      },
      blur: 0.85, radius: 14, maxOpacity: 1,
      width: CANVAS, height: CANVAS,
    });

    const greyHm = heatmapJs.create({
      container,
      gradient: { 0.0: "black", 1.0: "white" },
      radius: 14, maxOpacity: 1,
      width: CANVAS, height: CANVAS,
    });

    fetch("/ich_heatmap.json")
      .then(r => r.json())
      .then(ichData => {
        if (!mountedRef.current) return;

        // Project all points. CanvasTexture has flipY=true by default,
        // so we use original (non-negated) projection Y — the Y-flip corrects it.
        const pts = ichData.features.map((el: any) => {
          const [x = 0, y = 0] = projection([el.geometry.coordinates[0], el.geometry.coordinates[1]]) ?? [];
          return [x, y] as [number, number];
        });
        if (pts.length === 0) return;

        // Compute dynamic extent: max abs value of projected coordinates
        let maxAbs = 0;
        for (const [x, y] of pts) {
          maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(y));
        }
        maxAbs = Math.ceil(maxAbs * 1.15); // +15% margin
        setPlaneExt(maxAbs * 2); // total plane dimension

        // Map: projection coordinate → canvas pixel
        //   projection [-maxAbs, maxAbs] → canvas [0, CANVAS)
        //   canv = (proj + maxAbs) / (2*maxAbs) * CANVAS
        const sc = CANVAS / (2 * maxAbs);
        const off = CANVAS / 2;

        const dataPts = pts.map(([x, y]: [number, number]) => ({
          x: Math.floor(x * sc + off),
          y: Math.floor(y * sc + off),
          value: 1,
        }));

        const maxV = 6;
        colorHm.setData({ max: maxV, min: 0, data: dataPts });
        greyHm.setData({ max: maxV, min: 0, data: dataPts });

        const colorTex = new CanvasTexture(colorHm._renderer.canvas);
        const greyTex = new CanvasTexture(greyHm._renderer.canvas);
        colorTex.needsUpdate = true; greyTex.needsUpdate = true;

        texCache.set(ck + "_color", colorTex);
        texCache.set(ck + "_grey", greyTex);

        unis.current.heatMap.value = colorTex;
        unis.current.greyMap.value = greyTex;
      });

    return () => { mountedRef.current = false; };
  }, [projection]);

  if (planeExt === 0) return null;

  return (
    <group {...props} renderOrder={11}>
      <mesh ref={refMesh} material={material}>
        <planeGeometry args={[planeExt, planeExt, 300, 300]} />
      </mesh>
    </group>
  );
}
