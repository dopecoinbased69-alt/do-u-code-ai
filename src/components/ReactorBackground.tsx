import { Canvas, useFrame } from '@react-three/fiber';
import { useLocation } from 'react-router-dom';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const COLORS = {
  blue: 0x2563eb,
  gold: 0xfacc15,
  black: 0x111111,
  outline: 0xfacc15,
};

function Ring({ radius, tube, rotation }: { radius: number; tube: number; rotation: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const speed = useMemo(() => 0.005 + Math.random() * 0.005, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.z += speed;
  });

  const segments = useMemo(() => {
    const items: { pos: [number, number, number]; rotZ: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      items.push({
        pos: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
        rotZ: angle,
      });
    }
    return items;
  }, [radius]);

  // Outer group applies the static tilt; inner group spins
  return (
    <group rotation={rotation}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[radius, tube, 16, 100]} />
          <meshStandardMaterial color={COLORS.blue} roughness={0.3} metalness={0.2} />
        </mesh>
        {segments.map((s, i) => (
          <mesh key={i} position={s.pos} rotation={[0, 0, s.rotZ]}>
            <boxGeometry args={[tube * 2.2, tube * 2.2, tube * 2.5]} />
            <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.2} />
          </mesh>
        ))}
        <mesh>
          <torusGeometry args={[radius, tube * 1.08, 16, 100]} />
          <meshBasicMaterial color={COLORS.outline} side={THREE.BackSide} />
        </mesh>
      </group>
    </group>
  );
}

function Orbital({ dist, size, offset }: { dist: number; size: number; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.02;

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed;
      ref.current.rotation.x += speed * 0.5;
    }
  });

  return (
    <group rotation={[0, 0, offset]} ref={ref}>
      <mesh position={[dist, dist, 0]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={COLORS.black} roughness={0.2} />
        <mesh>
          <sphereGeometry args={[size * 1.2, 32, 32]} />
          <meshBasicMaterial color={COLORS.outline} side={THREE.BackSide} />
        </mesh>
      </mesh>
    </group>
  );
}

function Atom() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial color={COLORS.black} roughness={0.1} metalness={0.9} />
      </mesh>
      <Ring radius={4.5} tube={0.5} rotation={[Math.PI / 4, 0, 0]} />
      <Ring radius={4.5} tube={0.5} rotation={[-Math.PI / 4, Math.PI / 2, 0]} />
      <Orbital dist={1.8} size={0.4} offset={0} />
      <Orbital dist={1.8} size={0.3} offset={Math.PI} />
    </group>
  );
}

export default function ReactorBackground() {
  const location = useLocation();

  const opacity = useMemo(() => {
    if (location.pathname.startsWith('/preview')) return 0.9;
    if (location.pathname === '/') return 0.4;
    return 0.2;
  }, [location.pathname]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none transition-opacity duration-700"
      style={{ zIndex: 0, opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Atom />
      </Canvas>
    </div>
  );
}
