import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef } from 'react';
import * as THREE from 'three';
import { ParticleField } from './Particles';
import { deviceIntensity, usePrefersReducedMotion, useVisibilityPause } from './lib';

/** The holographic centerpiece: a distorting, glowing icosahedron in a wire shell. */
function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
      <mesh ref={ref} scale={1.45}>
        <icosahedronGeometry args={[1, 6]} />
        <MeshDistortMaterial
          color="#6d5cff"
          emissive="#3a2bff"
          emissiveIntensity={0.55}
          roughness={0.15}
          metalness={0.6}
          distort={0.38}
          speed={1.6}
        />
      </mesh>
      <mesh scale={1.62}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#38e0ff" wireframe transparent opacity={0.18} />
      </mesh>
    </Float>
  );
}

/**
 * Full cinematic hero scene for the Landing / Login front door. Bloom (an extra
 * full-screen pass) is reserved for desktop widths; the loop pauses when hidden and
 * renders nothing under prefers-reduced-motion.
 */
export default function HeroScene() {
  const reduced = usePrefersReducedMotion();
  const hidden = useVisibilityPause();
  if (reduced) return null;
  const withBloom = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <Canvas
      frameloop={hidden ? 'never' : 'always'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 55 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2.4} color="#8b7bff" />
      <pointLight position={[-5, -3, 2]} intensity={1.8} color="#38e0ff" />
      <Orb />
      <ParticleField intensity={deviceIntensity(1)} />
      {withBloom && (
        <EffectComposer>
          <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur radius={0.8} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
