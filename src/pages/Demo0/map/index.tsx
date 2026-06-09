import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import { gsap } from "gsap";
import { Mesh, LineSegments } from "three";
import BaseMap from "./baseMap";
import FlyLine from "./flyLine";

export default function Index() {
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<any>(null);
  const projection = useMemo(() => geoMercator().center([104.5, 35.2]).translate([0, 0]), []);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    const tl = gsap.timeline();
    // Phase 1 (0-2s): Camera fly-in
    tl.to(camera.position, {
      x: 0, y: 65, z: 95, duration: 2, ease: "circ.out",
    });
    // Phase 2 (starts at 1.8s): Map rises from flat to 3D
    tl.to(groupRef.current.scale, {
      x: 0.65, y: 0.65, z: 0.65, duration: 1.2, ease: "circ.out",
    }, 1.8);
    // Phase 2: Materials fade in (starts at 1.8s)
    groupRef.current.traverse((obj: any) => {
      if (obj instanceof Mesh || obj instanceof LineSegments) {
        if (obj.material && obj.material.opacity !== undefined) {
          tl.to(obj.material, { opacity: obj.userData?.targetOpacity ?? 0.9, duration: 1, ease: "circ.out" }, 1.8);
        }
      }
    });
    return () => { tl.kill(); };
  }, [camera]);

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} scale-z={0.01} position={[0, 5, 0]}>
      <BaseMap projection={projection} />
      <FlyLine projection={projection} />
    </group>
  );
}
