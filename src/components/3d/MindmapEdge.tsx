import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CubicBezierLine } from '@react-three/drei';
import { computeBezierControlPoints } from '../../utils/spatialMath';

interface MindmapEdgeProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  selected?: boolean;
}

export const MindmapEdge: React.FC<MindmapEdgeProps> = ({
  start,
  end,
  color = '#6366f1',
  selected = false,
}) => {
  const { midA, midB } = useMemo(() => {
    return computeBezierControlPoints(start, end);
  }, [start, end]);

  // Midpoint for a subtle signal particle or floating dot along the curve
  const centerPoint = useMemo(() => {
    return new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    );
  }, [start, end]);

  return (
    <group>
      {/* Primary Bezier Curve Line */}
      <CubicBezierLine
        start={start}
        end={end}
        midA={midA}
        midB={midB}
        color={selected ? '#ffffff' : color}
        lineWidth={selected ? 2.5 : 1.6}
        transparent
        opacity={selected ? 0.95 : 0.65}
      />

      {/* Subtle midpoint floating node connector bead */}
      <mesh position={centerPoint}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  );
};
