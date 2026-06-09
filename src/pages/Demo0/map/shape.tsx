import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { Box2, ExtrudeGeometry, Float32BufferAttribute, Mesh, Shape, ShapeGeometry, Texture } from "three";
import type { Args } from "@react-three/fiber";

/* ========= Flat Shape ========= */

export type ShapeProps = Omit<React.JSX.IntrinsicElements["mesh"], "args"> & {
  ref?: Ref<Mesh>;
  args?: Args<typeof ShapeGeometry>;
  bbox: Box2;
};

function ShapeBoxInner(props: ShapeProps) {
  const { ref, args, bbox, children, ...meshProps } = props;
  const meshRef = useRef<Mesh>(null!);
  useImperativeHandle(ref, () => meshRef.current);

  useLayoutEffect(() => {
    const { geometry } = meshRef.current;
    const pos = geometry.attributes.position;
    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;
    const uv: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      uv.push((pos.getX(i) - bbox.min.x) / width, (pos.getY(i) - bbox.min.y) / height);
    }
    geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  });

  return (
    <mesh ref={meshRef} {...meshProps}>
      <shapeGeometry attach="geometry" args={args} />
      {children}
    </mesh>
  );
}

export default ShapeBoxInner;

/* ========= Extruded Shape with terrain texture (imitates reference project) ========= */

export type ExtrudeProps = Omit<React.JSX.IntrinsicElements["mesh"], "args"> & {
  ref?: Ref<Mesh>;
  shapes: Shape[];
  depth: number;
  bbox: Box2;
  terrainMap: Texture | null;
  normalMap?: Texture | null;
  displacementMap?: Texture | null;
  sideColor?: string;
};

function ExtrudeBoxInner(props: ExtrudeProps) {
  const { ref, shapes, depth, bbox, terrainMap, normalMap, displacementMap, sideColor = "#a0a0a0", children, ...meshProps } = props;
  const meshRef = useRef<Mesh>(null!);
  useImperativeHandle(ref, () => meshRef.current);

  useLayoutEffect(() => {
    const geometry = meshRef.current.geometry as ExtrudeGeometry;
    const pos = geometry.attributes.position;
    const bboxW = bbox.max.x - bbox.min.x;
    const bboxH = bbox.max.y - bbox.min.y;
    const uv: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (z > depth * 0.99 || z < 0.01) {
        // Top & bottom faces: use XY -> UV like the reference ShapeBox
        uv.push((x - bbox.min.x) / bboxW, (y - bbox.min.y) / bboxH);
      } else {
        // Side walls: U along perimeter, V along height
        uv.push((x - bbox.min.x) / bboxW, z / depth);
      }
    }
    geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  });

  // Texture wrapping is handled by the texture creator (terrainTexture.ts or TextureLoader)
  // DO NOT override here to avoid conflicts

  return (
    <mesh ref={meshRef} {...meshProps}>
      <extrudeGeometry attach="geometry" args={[shapes, { depth, bevelEnabled: false }]} />
      {/* Side walls (material index 1) */}
      <meshStandardMaterial
        attach="material-1"
        color={sideColor}
        metalness={0.05}
        roughness={0.7}
        side={2}
        transparent
        opacity={0.9}
      />
      {/* Top face (material index 0) — terrain texture as map (like reference) */}
      <meshStandardMaterial
        attach="material-0"
        map={terrainMap || undefined}
        normalMap={normalMap || undefined}
        displacementMap={displacementMap || undefined}
        displacementScale={3.0}
        displacementBias={0}
        color="#ffffff"
        metalness={0.2}
        roughness={0.5}
        side={2}
        transparent
        opacity={0.92}
      />
      {children}
    </mesh>
  );
}

export const ExtrudeBox = ExtrudeBoxInner;
