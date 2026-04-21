import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ReactNode, useMemo } from 'react';

export type GameQuality = 'low' | 'medium' | 'high';

interface Props {
  children: ReactNode;
  quality?: GameQuality;
  cameraPosition?: [number, number, number];
  fov?: number;
}

/**
 * Mobile-optimized R3F canvas. Caps DPR, gates antialiasing/bloom by quality,
 * uses `powerPreference: 'high-performance'` and `frameloop="always"` (60fps).
 * Use as the root of any game scene to inherit perf-safe defaults.
 */
export default function GameCanvas({
  children,
  quality = 'medium',
  cameraPosition = [0, 4, 8],
  fov = 55,
}: Props) {
  const dpr = useMemo<[number, number]>(() => {
    if (quality === 'low') return [1, 1];
    if (quality === 'high') return [1, 2];
    return [1, 1.5];
  }, [quality]);

  const antialias = quality !== 'low';

  return (
    <Canvas
      shadows={quality === 'high'}
      dpr={dpr}
      camera={{ position: cameraPosition, fov }}
      gl={{
        antialias,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a0a0a');
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={2.2}
        castShadow={quality === 'high'}
        shadow-mapSize={[1024, 1024]}
      />
      {children}
      {quality !== 'low' && (
        <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
          <Bloom
            intensity={quality === 'high' ? 0.9 : 0.6}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}