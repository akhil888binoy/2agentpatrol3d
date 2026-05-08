"use client";

import dynamic from "next/dynamic";

const RobotScene = dynamic(() => import("./RobotScene"), { ssr: false });

export default function Hero3D() {
  return (
    // fixed + z-9999 so the canvas is always rendered above every DOM element
    // pointer-events: none so page content below remains interactive
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
      <RobotScene />
    </div>
  );
}
