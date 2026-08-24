'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Zone } from '@/types/customization';

const ZONE_ROTATIONS: Record<Zone, number> = {
  front: 0,
  back: Math.PI,
  rightSleeve: -Math.PI / 2,
  leftSleeve: Math.PI / 2,
};

interface TshirtProps {
  mergedTexture: THREE.CanvasTexture | null;
  activeTab: Zone;
  userInteracting: boolean;
}

export function Tshirt({ mergedTexture, activeTab, userInteracting }: TshirtProps) {
  const gltf = useGLTF('/oversized_t-shirt-optimized.glb');
  const groupRef = useRef<THREE.Group>(null);

  const [isInitialSpinning, setIsInitialSpinning] = useState(true);
  const spinProgress = useRef(0);
  const targetRotationY = useRef(ZONE_ROTATIONS[activeTab]);

  useEffect(() => {
    targetRotationY.current = ZONE_ROTATIONS[activeTab];
  }, [activeTab]);

  useEffect(() => {
    if (gltf && mergedTexture) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.map = mergedTexture;
          child.material.roughness = 1;
          child.material.metalness = 0;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [gltf, mergedTexture]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isInitialSpinning) {
      spinProgress.current += delta / 2.0;

      if (spinProgress.current >= 1) {
        spinProgress.current = 1;
        setIsInitialSpinning(false);
        groupRef.current.rotation.y = targetRotationY.current;
        return;
      }

      const t = spinProgress.current;
      const easeOutQuint = 1 - Math.pow(1 - t, 5);
      groupRef.current.rotation.y = targetRotationY.current + easeOutQuint * (Math.PI * 2);
      return;
    }

    if (!userInteracting) {
      const baseRotationY = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        delta * 4
      );

      const time = state.clock.getElapsedTime();
      const idleSway = Math.sin(time * 1.5) * 0.003;

      groupRef.current.rotation.y = baseRotationY + idleSway;
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.008;
    } else {
      targetRotationY.current = groupRef.current.rotation.y;
    }
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload('/oversized_t-shirt-optimized.glb');