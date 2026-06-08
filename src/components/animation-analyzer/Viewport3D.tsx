import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

interface Viewport3DProps {
  modelUrl?: string;
  showSkeleton?: boolean;
  showGrid?: boolean;
  animationIndex?: number;
  isPlaying?: boolean;
  speed?: number;
  onModelLoaded?: (model: THREE.Group) => void;
  onAnimationsLoaded?: (animations: THREE.AnimationClip[]) => void;
}

interface ModelViewerProps extends Viewport3DProps {}

const ModelViewer = React.forwardRef<THREE.Group, ModelViewerProps>(
  ({
    modelUrl,
    showSkeleton = true,
    animationIndex = 0,
    isPlaying = false,
    speed = 1,
    onModelLoaded,
    onAnimationsLoaded,
  }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const skeletonHelperRef = useRef<THREE.LineSegments | null>(null);
    const actionsRef = useRef<THREE.AnimationAction[]>([]);
    const currentActionRef = useRef<THREE.AnimationAction | null>(null);
    const { scene } = useThree();

    useFrame((state, delta) => {
      if (mixerRef.current) {
        mixerRef.current.update(delta * speed);
      }
    });

    useEffect(() => {
      if (!modelUrl || !groupRef.current) return;

      const loadModel = async () => {
        try {
          let model: THREE.Group;
          const loader = modelUrl.endsWith('.fbx') ? new FBXLoader() : new GLTFLoader();

          if (modelUrl.endsWith('.fbx')) {
            model = await (loader as FBXLoader).loadAsync(modelUrl);
          } else {
            const gltf = await (loader as GLTFLoader).loadAsync(modelUrl);
            model = gltf.scene;
          }

          // Clear previous model
          while (groupRef.current!.children.length > 0) {
            groupRef.current!.remove(groupRef.current!.children[0]);
          }

          groupRef.current!.add(model);

          // Setup animations
          const animations = model.animations || [];
          if (mixerRef.current) {
            mixerRef.current.stopAllAction();
          }
          mixerRef.current = new THREE.AnimationMixer(model);
          actionsRef.current = animations.map((clip) =>
            mixerRef.current!.clipAction(clip)
          );

          // Setup skeleton visualization
          if (showSkeleton) {
            if (skeletonHelperRef.current) {
              scene.remove(skeletonHelperRef.current);
            }
            // Create a simple skeleton visualization
            const skeletonGroup = new THREE.Group();
            model.traverse((child) => {
              if (child instanceof THREE.Bone) {
                child.castShadow = true;
              }
            });
            skeletonHelperRef.current = skeletonGroup as any;
            scene.add(skeletonGroup);
          }

          if (onModelLoaded) onModelLoaded(model);
          if (onAnimationsLoaded) onAnimationsLoaded(animations);
        } catch (error) {
          console.error('Error loading model:', error);
        }
      };

      loadModel();
    }, [modelUrl, showSkeleton, scene, onModelLoaded, onAnimationsLoaded]);

    useEffect(() => {
      if (actionsRef.current.length === 0) return;

      const action = actionsRef.current[animationIndex];
      if (!action) return;

      if (currentActionRef.current && currentActionRef.current !== action) {
        currentActionRef.current.stop();
      }

      currentActionRef.current = action;

      if (isPlaying) {
        action.play();
      } else {
        action.stop();
      }
    }, [animationIndex, isPlaying]);

    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>
    );
  }
);

ModelViewer.displayName = 'ModelViewer';

const Viewport3D: React.FC<Viewport3DProps> = (props) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <PerspectiveCamera makeDefault position={[0, 1.5, 3]} fov={50} />
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment preset="studio" />
      {props.showGrid && <Grid args={[10, 10]} />}
      <ModelViewer {...props} />
    </Canvas>
  );
};

export default Viewport3D;
