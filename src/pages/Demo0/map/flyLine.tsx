import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from "three";
import { type GeoProjection } from "d3-geo";

// ICH cultural corridors: province centroids for fly lines
const ICH_CORRIDORS: [number, number][][] = [
  [[116.4, 39.9], [121.5, 31.2], [120.2, 30.3]],   // Beijing → Shanghai → Zhejiang
  [[120.2, 30.3], [117.0, 36.7], [112.5, 37.9]],   // Zhejiang → Shandong → Shanxi
  [[104.1, 30.6], [102.7, 25.0], [106.7, 26.6]],   // Sichuan → Yunnan → Guizhou
  [[113.3, 23.1], [110.3, 20.0], [108.3, 22.8]],   // Guangdong → Hainan → Guangxi
  [[116.4, 39.9], [113.6, 34.8], [108.9, 34.3]],   // Beijing → Henan → Shaanxi
  [[114.3, 30.6], [112.0, 28.2], [115.9, 28.7]],   // Hubei → Hunan → Jiangxi
  [[91.1, 29.7], [101.7, 36.6], [103.8, 36.1]],    // Tibet → Qinghai → Gansu
  [[120.2, 30.3], [119.3, 26.1], [121.5, 25.0]],   // Zhejiang → Fujian → Taiwan (via Fujian coast)
];

export default function FlyLine({ projection }: { projection: GeoProjection }) {
  const index = useRef(0);
  const num = useRef(50);
  const geometry = useRef(new BufferGeometry());
  const curve = useRef<CatmullRomCurve3>(null);
  const points = useRef<Vector3[]>([]);

  useEffect(() => {
    const allV3: Vector3[] = [];
    ICH_CORRIDORS.forEach((corridor) => {
      corridor.forEach(([lng, lat]) => {
        const [x, y] = projection([lng, lat])!;
        allV3.push(new Vector3(x, -y, 0.49));
      });
    });

    points.current = new CatmullRomCurve3(allV3).getSpacedPoints(600);
    index.current = Math.floor(Math.random() * (points.current.length - 50));

    const seg = points.current.slice(index.current, index.current + num.current);
    curve.current = new CatmullRomCurve3(seg);
    const pts = curve.current.getSpacedPoints(200);

    geometry.current.setFromPoints(pts);
    const half = Math.floor(pts.length / 2);
    const percentArr = pts.map((_, i) => (i < half ? i / half : 1 - (i - half) / half));
    geometry.current.attributes.percent = new Float32BufferAttribute(percentArr, 1);
  }, [projection]);

  useFrame((_, delta) => {
    if (!curve.current) return;
    const pts = points.current;
    const total = pts.length;
    index.current = (index.current + 50 * delta) % total;

    const start = Math.floor(index.current);
    const end = start + num.current;
    const segment = end <= total ? pts.slice(start, end) : pts.slice(start).concat(pts.slice(0, end - total));

    curve.current.points = segment;
    const newPts = curve.current.getSpacedPoints(200);
    geometry.current.setFromPoints(newPts);
  });

  return (
    <object3D position={[0, 0, 0.01]}>
      <points geometry={geometry.current}>
        <pointsMaterial
          transparent color="#e8c878" size={0.25}
          onBeforeCompile={(shader) => {
            shader.vertexShader = shader.vertexShader
              .replace("void main() {", "attribute float percent;\nvoid main() {")
              .replace("gl_PointSize = size;", "gl_PointSize = percent * size;");
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <output_fragment>",
              `#include <output_fragment>\nfloat r = distance(gl_PointCoord, vec2(0.5));\nfloat alpha = pow(1.0 - r / 0.5, 6.0);\ngl_FragColor = vec4(gl_FragColor.rgb, gl_FragColor.a * alpha);`
            );
          }}
        />
      </points>
    </object3D>
  );
}
