/**
 * Simple lights without leva (which crashes inside R3F Canvas).
 * To adjust lighting, change the values below directly.
 */
export const AmbientLight = () => {
  return <ambientLight intensity={3.5} color="#fffaf0" />;
};

export const PointLight = () => {
  return <pointLight intensity={800} position={[-5, 25, 15]} distance={60} color="#fff8ee" />;
};
