import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MindmapNode, CameraFocusTarget } from '../../types';
import { MindmapNodeMesh } from './MindmapNodeMesh';
import { MindmapEdge } from './MindmapEdge';
import { CameraController } from './CameraController';
import { SpatialBackground } from './SpatialBackground';

interface MindmapCanvasProps {
  nodes: MindmapNode[];
  selectedNodeId: string | null;
  focusTarget: CameraFocusTarget | null;
  isDraggingNode: boolean;
  isDetailOpen?: boolean;
  onSelectNode: (node: MindmapNode | null) => void;
  onClickNode: (node: MindmapNode) => void;
  onDoubleClickNode: (node: MindmapNode) => void;
  onContextMenuNode: (node: MindmapNode, x: number, y: number) => void;
  onNodePositionChange: (id: string, newPos: [number, number, number]) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onFocusComplete?: () => void;
  controlsRef: React.RefObject<any>;
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
  nodes,
  selectedNodeId,
  focusTarget,
  isDraggingNode,
  isDetailOpen = false,
  onSelectNode,
  onClickNode,
  onDoubleClickNode,
  onContextMenuNode,
  onNodePositionChange,
  onDragStateChange,
  onFocusComplete,
  controlsRef,
}) => {
  // Map of nodes for quick parent lookups
  const nodeMap = new Map<string, MindmapNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      id="3d-canvas-container"
      className="w-full h-full relative overflow-hidden bg-slate-950 select-none"
      onContextMenu={(e) => {
        // Prevent default browser context menu on canvas
        e.preventDefault();
      }}
    >
      <Canvas
        camera={{ position: [0, 8, 22], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerDown={(e) => {
          // If user clicks the canvas background, deselect
          if (e.target === (e.currentTarget as any).querySelector('canvas')) {
            onSelectNode(null);
          }
        }}
      >
        {/* Cinematic 3D Scene Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[12, 20, 15]} intensity={1.2} />
        <directionalLight position={[-12, -10, -10]} intensity={0.4} color="#38bdf8" />
        <pointLight position={[0, 0, 0]} intensity={1.0} distance={20} color="#818cf8" />

        {/* Orbit Controls (disabled while node is being dragged in 3D) */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!isDraggingNode}
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={85}
          maxPolarAngle={Math.PI / 1.05}
          screenSpacePanning={true}
        />

        {/* Dynamic Camera Lerp Controller */}
        <CameraController
          focusTarget={focusTarget}
          onFocusComplete={onFocusComplete}
          controlsRef={controlsRef}
        />

        {/* Spatial Background (Starfield dust & subtle grid) */}
        <SpatialBackground />

        {/* 3D Dynamic Bezier Edges */}
        {nodes.map((node) => {
          if (!node.parentId) return null;
          const parent = nodeMap.get(node.parentId);
          if (!parent) return null;

          const isConnectedToSelected =
            node.id === selectedNodeId || parent.id === selectedNodeId;

          return (
            <MindmapEdge
              key={`edge-${parent.id}-${node.id}`}
              start={parent.position}
              end={node.position}
              color={node.color}
              selected={isConnectedToSelected}
            />
          );
        })}

        {/* 3D Nodes */}
        {nodes.map((node) => (
          <MindmapNodeMesh
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isDetailOpen={isDetailOpen}
            onSelect={(n) => onSelectNode(n)}
            onClickNode={onClickNode}
            onDoubleClick={(n) => onDoubleClickNode(n)}
            onContextMenu={(n, x, y) => onContextMenuNode(n, x, y)}
            onPositionChange={onNodePositionChange}
            onDragStateChange={onDragStateChange}
          />
        ))}
      </Canvas>
    </div>
  );
};
