import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sphericalPositions } from './lib';

/** A single slowly-drifting additive point cloud. */
export function Stars({
  count,
  radius,
  size,
  color,
  opacity,
  speed,
}: {
  count: number;
  radius: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => sphericalPositions(count, radius), [count, radius]);

  useFrame((_, delta) => {
    const p = ref.current;
    if (!p) return;
    p.rotation.y += delta * speed;
    p.rotation.x += delta * speed * 0.35;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Layered starfield with subtle pointer-driven parallax (the depth illusion). */
export function ParticleField({ intensity = 1 }: { intensity?: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.3, 0.03);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.3, 0.03);
  });

  return (
    <group ref={group}>
      <Stars count={Math.round(1400 * intensity)} radius={9} size={0.03} color="#b9b2ff" opacity={0.9} speed={0.012} />
      <Stars count={Math.round(700 * intensity)} radius={6} size={0.05} color="#38e0ff" opacity={0.55} speed={0.02} />
      <Stars count={Math.round(450 * intensity)} radius={13} size={0.022} color="#ffffff" opacity={0.7} speed={0.008} />
    </group>
  );
}
