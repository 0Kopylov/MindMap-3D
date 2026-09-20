import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraFocusTarget } from '../../types';

interface CameraControllerProps {
  focusTarget: CameraFocusTarget | null;
  onFocusComplete?: () => void;
  controlsRef: React.RefObject<any>;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  focusTarget,
  onFocusComplete,
  controlsRef,
}) => {
  const { camera, gl } = useThree();
  const isTransitioning = useRef(false);
  const startTime = useRef<number>(0);
  const duration = 650; // ms transition duration

  const startCamPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const targetCamPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  // Cancel transition immediately whenever user interacts with controls
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleUserInteraction = () => {
      if (isTransitioning.current) {
        isTransitioning.current = false;
        if (onFocusComplete) {
          onFocusComplete();
        }
      }
    };

    controls.addEventListener('start', handleUserInteraction);
    return () => {
      controls.removeEventListener('start', handleUserInteraction);
    };
  }, [controlsRef, onFocusComplete]);

  // Also listen on canvas DOM element for pointerdown and wheel to immediately release camera lock
  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;

    const handlePointerOrWheel = () => {
      if (isTransitioning.current) {
        isTransitioning.current = false;
        if (onFocusComplete) {
          onFocusComplete();
        }
      }
    };

    domElement.addEventListener('pointerdown', handlePointerOrWheel);
    domElement.addEventListener('wheel', handlePointerOrWheel, { passive: true });
    return () => {
      domElement.removeEventListener('pointerdown', handlePointerOrWheel);
      domElement.removeEventListener('wheel', handlePointerOrWheel);
    };
  }, [gl, onFocusComplete]);

  useEffect(() => {
    if (focusTarget && focusTarget.active) {
      startCamPos.current.copy(camera.position);
      if (controlsRef.current) {
        startTarget.current.copy(controlsRef.current.target);
      } else {
        startTarget.current.set(0, 0, 0);
      }

      targetCamPos.current.set(
        focusTarget.position[0],
        focusTarget.position[1],
        focusTarget.position[2]
      );
      targetLookAt.current.set(
        focusTarget.target[0],
        focusTarget.target[1],
        focusTarget.target[2]
      );

      startTime.current = performance.now();
      isTransitioning.current = true;
    } else {
      isTransitioning.current = false;
    }
  }, [focusTarget, camera, controlsRef]);

  useFrame(() => {
    if (!isTransitioning.current) return;

    const elapsed = performance.now() - startTime.current;
    const progress = Math.min(1, elapsed / duration);
    // Smooth cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3);

    // Interpolate camera position
    camera.position.lerpVectors(startCamPos.current, targetCamPos.current, ease);

    // Interpolate orbit controls target
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(startTarget.current, targetLookAt.current, ease);
      controlsRef.current.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    if (progress >= 1) {
      camera.position.copy(targetCamPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
      if (onFocusComplete) {
        onFocusComplete();
      }
    }
  });

  return null;
};
