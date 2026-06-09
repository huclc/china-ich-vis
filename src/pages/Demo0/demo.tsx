import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, Stars } from "@react-three/drei";
import styled from "styled-components";
import { AmbientLight, PointLight } from "./map/lights";
import Panel from "./panel";
import ProvinceDetailPanel from "./ProvinceDetailPanel";
import SCMap from "./map";

const Wrapper = styled.div`position:relative;width:100vw;height:100vh;background:#f5f0e8;`;
const CanvasWrapper = styled.div`position:absolute;inset:0;width:100%;height:100%;`;


export default function Demo() {
  return (
    <Wrapper>
      <CanvasWrapper>
        <Canvas camera={{ fov: 70 }} dpr={[1, 2]}>
          <color attach="background" args={["#f5f0e8"]} />
          <Grid
            infiniteGrid
            scale={2}
            cellSize={0.3}
            cellThickness={0.6}
            sectionSize={1.5}
            sectionThickness={1.5}
            sectionColor="#C7A46A"
            cellColor="rgba(93,166,174,0.15)"
            fadeDistance={30}
          />
          <AmbientLight />
          <PointLight />
          <Stars fade count={400} factor={4} saturation={0.15} speed={1.2} />
          <SCMap />
          <OrbitControls
            enablePan={true} enableZoom={true} enableRotate={true}
            zoomSpeed={0.5} rotateSpeed={0.4}
            minDistance={40} maxDistance={150}
            maxPolarAngle={Math.PI / 2.2} minPolarAngle={0.3}
          />
        </Canvas>
      </CanvasWrapper>
      <Panel />
      <ProvinceDetailPanel />
    </Wrapper>
  );
}
