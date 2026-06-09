import { useLayoutEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router";
import { gsap } from "gsap";
import Demo0 from "./pages/Demo0";

function App() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [location.key]);

  return (
    <div ref={containerRef} style={{ willChange: "transform, opacity" }}>
      <Routes>
        <Route path="/" element={<Demo0 />} />
        <Route path="/demo0" element={<Demo0 />} />
      </Routes>
    </div>
  );
}

export default App;
