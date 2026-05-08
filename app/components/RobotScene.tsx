"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Center, Bounds } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useRef, useEffect } from "react";
import * as THREE from "three";

// ─── Shared animation state ───────────────────────────────────────────────────
// One ref object mutated by window listeners — zero re-renders.
interface AnimState {
  scroll: number;  // 0-1, window.scrollY / max
  mouseX: number;  // -1..1
}

// ─── Per-frame lerped values ──────────────────────────────────────────────────
interface Lerped {
  rotY: number;
  posX: number;
  posY: number;
  posZ: number;
}

// ─── Clockwise scroll target ──────────────────────────────────────────────────
// rotY decreases monotonically → clockwise when viewed from the front.
// One full 360° CW sweep from s=0 to s=1 (ends face-forward again).
// posY descends by 3× robot half-height so the robot moves well into the
// features section as the user scrolls.
function scrollTarget(s: number): Lerped {
  const rotY = Math.PI - s * Math.PI * 2;
  return { rotY, posX: 0, posY: 0, posZ: 0 };
}

// ─── Robot ────────────────────────────────────────────────────────────────────

function Robot({ animRef }: { animRef: React.RefObject<AnimState> }) {
  const { scene } = useGLTF("/3d/robot_police.glb");
  const ref = useRef<THREE.Group>(null);
  const eyeMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const domeMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const robotHalfHeight = useRef(0);

  // Lerped values — mutated each frame, never cause re-renders
  const lerped = useRef<Lerped>({ rotY: Math.PI, posX: 0, posY: 0, posZ: 0 });

  useEffect(() => {
    eyeMats.current = [];
    domeMats.current = [];

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const name = child.name.toLowerCase();
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat || !("emissive" in mat)) return;

      // Clone so we don't mutate shared material instances
      child.material = mat.clone();
      const m = child.material as THREE.MeshStandardMaterial;

      // Eyes / lens — command blue glow
      if (/eye|lens|iris|pupil|retina|glow/i.test(name)) {
        m.emissive.set("#0066FF");
        m.emissiveIntensity = 3.0;
        eyeMats.current.push(m);
      }

      // Dome / siren — amber glow to match warm body
      if (/dome|siren|beacon|alarm/i.test(name)) {
        m.emissive.set("#ff9d3c");
        m.emissiveIntensity = 0.4;
        domeMats.current.push(m);
      }

    });

    // Compute model height once so Y descent scales correctly
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    robotHalfHeight.current = size.y * 0.5;
  }, [scene]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;

    const { scroll: s, mouseX } = animRef.current!;

    // ── Mobile: stationary with idle bob ────────────────────────────────────
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      g.rotation.y = Math.PI;
      g.position.set(0, Math.sin(state.clock.elapsedTime * 0.8) * 0.04, 0);
      const pulse = 0.3 * Math.sin(state.clock.elapsedTime * 2.5);
      eyeMats.current.forEach((m) => { m.emissiveIntensity = 3.0 + pulse; });
      domeMats.current.forEach((m) => { m.emissiveIntensity = 0.4; });
      return;
    }

    // ── Compute clockwise scroll target ──────────────────────────────────────
    const target = scrollTarget(s);

    // ── Lerp toward target at 0.05 — cinematic trailing weight ───────────────
    const L = 0.05;
    lerped.current.rotY += (target.rotY - lerped.current.rotY) * L;
    lerped.current.posX += (target.posX - lerped.current.posX) * L;
    lerped.current.posY += (target.posY - lerped.current.posY) * L;
    lerped.current.posZ += (target.posZ - lerped.current.posZ) * L;

    // ── Mouse adds a small CW-consistent reactive rotation on top ────────────
    const mouseOffset = mouseX * 0.15;

    g.rotation.y = lerped.current.rotY + mouseOffset;
    g.position.x = lerped.current.posX;
    g.position.y = lerped.current.posY + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    g.position.z = lerped.current.posZ;

    // Eyes glow brightest in the dark (s=0, no ambient light); dim slightly as scene lights up
    const pulse = 0.3 * Math.sin(state.clock.elapsedTime * 2.5);
    eyeMats.current.forEach((m) => { m.emissiveIntensity = 3.0 - s * 1.0 + pulse; });
    domeMats.current.forEach((m) => { m.emissiveIntensity = 0.4 + s * 0.8; });
  });

  return (
    <Center>
      <primitive ref={ref} object={scene} />
    </Center>
  );
}

// ─── Lights ───────────────────────────────────────────────────────────────────

function SceneLights({ animRef }: { animRef: React.RefObject<AnimState> }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef     = useRef<THREE.DirectionalLight>(null);
  const fillRef    = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const s = animRef.current!.scroll;
    if (ambientRef.current) ambientRef.current.intensity = s * 1.4;
    if (keyRef.current)     keyRef.current.intensity     = s * 2.2;
    if (fillRef.current)    fillRef.current.intensity    = s * 0.6;
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#ffe8cc" intensity={0} />
      <directionalLight ref={keyRef}  position={[1, 3, 4]}  color="#fff5e8" intensity={0} />
      <directionalLight ref={fillRef} position={[-2, 1, 2]} color="#ffd6a0" intensity={0} />
    </>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────

useGLTF.preload("/3d/robot_police.glb");

export default function RobotScene() {
  const animRef = useRef<AnimState>({ scroll: 0, mouseX: 0 });

  // Passive scroll listener — writes to ref only, zero React re-renders
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      animRef.current!.scroll = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse tracking for reactive rotation overlay
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      animRef.current!.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneLights animRef={animRef} />

        <Bounds fit clip margin={1.5}>
          <Robot animRef={animRef} />
        </Bounds>

        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />

        {/* Bloom — wide radius to spread the eye & dome glow */}
        <EffectComposer>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.8}
            luminanceSmoothing={0.2}
            intensity={0.4}
            radius={0.25}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
