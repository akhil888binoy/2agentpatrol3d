"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useRef, useEffect, useState } from "react";
import * as THREE from "three";

function Robot() {
  const { scene, animations } = useGLTF("/3d/flyingrobot.glb");
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, groupRef);
  const scrollRef = useRef(0);
  const alertMixRef = useRef(0);
  const glowMatsRef = useRef<Array<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>>([]);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      if (action) action.play();
    });
  }, [actions]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? Math.min(1, window.scrollY / max) : 0;

      const features = document.getElementById("features");
      if (!features) {
        alertMixRef.current = 0;
        return;
      }
      const triggerStart = features.offsetTop - window.innerHeight * 0.45;
      const triggerRange = window.innerHeight * 0.55;
      const raw = (window.scrollY - triggerStart) / triggerRange;
      alertMixRef.current = THREE.MathUtils.clamp(raw, 0, 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Material overrides
    glowMatsRef.current = [];
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const sourceMat = child.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
      if (!sourceMat || !("color" in sourceMat)) return;
      child.material = sourceMat.clone();
      const m = child.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
      if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (m.normalMap) m.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;

      const name = child.name.toLowerCase();
      m.color.set("#060a12");
      m.emissive.set("#000000");
      m.emissiveIntensity = 0;
      m.metalness = 0.5;
      m.roughness = 0.22;
      m.envMapIntensity = 0.45;

      if ("clearcoat" in m) {
        m.clearcoat = 0.55;
        m.clearcoatRoughness = 0.2;
      }

      // Dark panels / body pieces
      if (/body|torso|head|face|helmet|arm|leg|shoulder|panel|shell/.test(name)) {
        m.color.set("#04070d");
        m.metalness = 0.58;
        m.roughness = 0.2;
        return;
      }

      // Face indicators in glowing blue
      if (/eye|eyelid|retina|pupil|face_light|expression/.test(name)) {
        m.color.set("#0a2f5a");
        m.emissive.set("#57c7ff");
        m.emissiveIntensity = 1.5;
        m.metalness = 0.04;
        m.roughness = 0.08;
        m.toneMapped = false;
        glowMatsRef.current.push(m);
        return;
      }

      // Cyan LEDs / glow trims
      if (/led|light|neon|strip|trim|accent|line|ring|screen|visor|sensor|lamp/.test(name)) {
        m.color.set("#072846");
        m.emissive.set("#69d5ff");
        m.emissiveIntensity = 2.1;
        m.metalness = 0.1;
        m.roughness = 0.12;
        m.toneMapped = false;
        glowMatsRef.current.push(m);
        return;
      }

      // Feet and lower silhouettes get stronger blue edge
      if (/foot|feet|shoe|sole|base|bottom|wheel/.test(name)) {
        m.color.set("#051022");
        m.emissive.set("#47c8ff");
        m.emissiveIntensity = 1.45;
        m.metalness = 0.4;
        m.roughness = 0.15;
        m.toneMapped = false;
        glowMatsRef.current.push(m);
        return;
      }

      // Catch-all keeps a deep glossy black style
      m.color.set("#070b13");
      m.metalness = 0.48;
      m.roughness = 0.24;
    });
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    // Full scroll-driven rotation.
    g.rotation.y = -scrollRef.current * Math.PI * 2;
    g.position.y = -0.1 + Math.sin(t * 0.8) * 0.04;

    const mix = alertMixRef.current;
    const blue = new THREE.Color("#57c7ff");
    const red = new THREE.Color("#ff0000");
    const darkRedBase = new THREE.Color("#2a0000");
    const neutralBase = new THREE.Color("#0a2f5a");
    const redMix = THREE.MathUtils.smoothstep(mix, 0.35, 1);
    const hardMix = redMix > 0.85 ? 1 : redMix;
    const glowColor = blue.clone().lerp(red, hardMix);
    const baseColor = neutralBase.clone().lerp(darkRedBase, hardMix);
    for (const mat of glowMatsRef.current) {
      mat.emissive.copy(glowColor);
      mat.color.copy(baseColor);
      mat.emissiveIntensity = THREE.MathUtils.lerp(1.8, 2.8, hardMix);
    }
  });

  return (
    <group ref={groupRef} scale={[2, 2, 2]} position={[0, -0.1, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/3d/flyingrobot.glb");

export default function RobotScene() {
  const [underLightColor, setUnderLightColor] = useState("#51d2ff");

  useEffect(() => {
    const onScroll = () => {
      const features = document.getElementById("features");
      if (!features) {
        setUnderLightColor("#51d2ff");
        return;
      }
      const triggerStart = features.offsetTop - window.innerHeight * 0.45;
      const triggerRange = window.innerHeight * 0.55;
      const raw = (window.scrollY - triggerStart) / triggerRange;
      const mix = THREE.MathUtils.clamp(raw, 0, 1);
      const redMix = THREE.MathUtils.smoothstep(mix, 0.35, 1);
      const t = redMix > 0.85 ? 1 : redMix;
      const color = new THREE.Color("#51d2ff").lerp(new THREE.Color("#ff0000"), t);
      setUnderLightColor(`#${color.getHexString()}`);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 2, 4], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      shadows
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
      onCreated={({ gl, camera }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.38;
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, 1, 0);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.13} color="#5f93be" />
        <hemisphereLight args={["#5ac9ff", "#02040b", 0.22]} />
        <pointLight position={[0, 1.2, 6]} color="#8cd9ff" intensity={2.3} distance={12} decay={2} />
        <pointLight position={[-4, 0.5, 2.6]} color="#2ca3ff" intensity={1.35} distance={10} decay={2} />
        <pointLight position={[4, 0.5, 2.6]} color="#2ca3ff" intensity={1.35} distance={10} decay={2} />
        <pointLight position={[0, -2, 2.5]} color={underLightColor} intensity={0.24} distance={6} decay={2} />

        <Robot />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.74}
            luminanceSmoothing={0.88}
            intensity={0.22}
            mipmapBlur
            radius={0.26}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
