import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { Joystick } from './useTouchControls';

/**
 * Reference scene: a player cube driven by the left joystick on a reflective
 * floor with orbiting glow pillars. Designed as the starting point future
 * games can copy + extend.
 */
export default function DemoScene({
  move,
  look,
  jumpRef,
}: {
  move: Joystick;
  look: Joystick;
  jumpRef: React.MutableRefObject<number>;
}) {
  const player = useRef<THREE.Mesh>(null);
  const camRig = useRef<THREE.Group>(null);
  const yawRef = useRef(0);
  const vyRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (!player.current) return;

    // Yaw from look stick
    yawRef.current -= look.x * dt * 2.2;

    // Move stick: forward/strafe relative to yaw
    const speed = 5;
    const forward = -move.y * speed * dt;
    const strafe = move.x * speed * dt;
    const cosY = Math.cos(yawRef.current);
    const sinY = Math.sin(yawRef.current);
    player.current.position.x += sinY * forward + cosY * strafe;
    player.current.position.z += cosY * forward - sinY * strafe;

    // Gravity + jump (jumpRef is a frame-counter set by tap)
    if (jumpRef.current > 0 && player.current.position.y <= 0.51) {
      vyRef.current = 6;
      jumpRef.current = 0;
    }
    vyRef.current -= 16 * dt;
    player.current.position.y = Math.max(0.5, player.current.position.y + vyRef.current * dt);
    if (player.current.position.y <= 0.5) vyRef.current = 0;

    player.current.rotation.y = yawRef.current;

    // Third-person follow camera
    const camDist = 7;
    const camHeight = 3.5;
    const targetX = player.current.position.x - sinY * camDist;
    const targetZ = player.current.position.z - cosY * camDist;
    state.camera.position.lerp(
      new THREE.Vector3(targetX, player.current.position.y + camHeight, targetZ),
      0.12,
    );
    state.camera.lookAt(player.current.position);
  });

  const pillars = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return [Math.cos(a) * 6, 0, Math.sin(a) * 6] as [number, number, number];
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Grid lines via wireframe overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[40, 40, 20, 20]} />
        <meshBasicMaterial color="#0091ff" wireframe transparent opacity={0.15} />
      </mesh>
      {/* Player */}
      <mesh ref={player} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#0091ff"
          emissive="#0091ff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      {/* Glow pillars */}
      <group ref={camRig}>
        {pillars.map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <boxGeometry args={[0.6, 2 + (i % 3), 0.6]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#facc15"
              emissiveIntensity={0.5}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}