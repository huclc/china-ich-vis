import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Extrude } from "@react-three/drei";
import { Color, Shape, Vector2, type IUniform } from "three";
import { type GeoProjection } from "d3-geo";
import chinaMapData from "@/assets/china.json";

function OutLineAnimated() {
  const uniformsRef = useRef<{
    uRiseTime: IUniform<number>;
    uRiseColor: IUniform<Color>;
  }>({
    uRiseTime: { value: -0.8 },
    uRiseColor: { value: new Color("#C7A46A") },
  });

  useFrame(() => {
    uniformsRef.current.uRiseTime.value =
      uniformsRef.current.uRiseTime.value >= 0.5
        ? -0.8
        : uniformsRef.current.uRiseTime.value + 0.003;
  });

  return (
    <meshPhysicalMaterial
      transparent
      opacity={0.55}
      color="#e8dcc8"
      onBeforeCompile={(shader) => {
        shader.uniforms = { ...shader.uniforms, ...uniformsRef.current };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>\nvarying vec3 vTransformedNormal;\nvarying float vHeight;`)
          .replace("#include <begin_vertex>", `#include <begin_vertex>\nvTransformedNormal = normalize(normal);\nvHeight = transformed.z;`);
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>\nuniform vec3 uRiseColor;\nuniform float uRiseTime;\nvarying float vHeight;\nvarying vec3 vTransformedNormal;\nvec3 riseLine() { float smoothness = 0.5; float speed = uRiseTime; float isTopBottom = step(0.999, abs(vTransformedNormal.z)); float ratio = (1.0 - isTopBottom) * (smoothstep(speed, speed + smoothness, vHeight) - smoothstep(speed + smoothness, speed + smoothness * 2.0, vHeight)); return uRiseColor * ratio; }`
          )
          .replace("#include <dithering_fragment>", `#include <dithering_fragment>\ngl_FragColor = gl_FragColor + vec4(riseLine(), 1.0);`);
      }}
    />
  );
}

/**
 * Flatten MultiPolygon coordinates into a flat list of coordinate rings.
 * Handles both Polygon (number[][][]) and MultiPolygon (number[][][][]).
 */
function flattenRings(raw: any): number[][][] {
  if (!raw || !Array.isArray(raw) || !Array.isArray(raw[0])) return [];
  // Check if it's MultiPolygon: raw[0][0][0] is an array (a coordinate pair like [lng, lat])
  if (Array.isArray(raw[0][0]) && Array.isArray(raw[0][0][0])) {
    return raw.flat(1) as number[][][];
  }
  // Polygon: raw is already ring[][]
  return raw as number[][][];
}

export default function OutLine({ projection }: { projection: GeoProjection }) {
  const shapes = useMemo(() => {
    const result: { key: string; shape: Shape }[] = [];
    chinaMapData.features.forEach((feature) => {
      const rings = flattenRings(feature.geometry.coordinates);
      rings.forEach((coordinates, idx) => {
        if (!Array.isArray(coordinates) || coordinates.length < 3) return;
        try {
          const shape = new Shape(
            coordinates.map((coord) => {
              const [x, y] = projection(coord as [number, number])!;
              return new Vector2(x, -y);
            })
          );
          result.push({ key: `${feature.properties.name}--${idx}`, shape });
        } catch {
          // Skip degenerate rings
        }
      });
    });
    return result;
  }, [projection]);

  return (
    <group renderOrder={1}>
      {shapes.map(({ key, shape }) => (
        <Extrude key={key} args={[shape, { depth: 0.5, bevelEnabled: false }]}>
          <OutLineAnimated />
        </Extrude>
      ))}
    </group>
  );
}
