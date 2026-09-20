import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MindmapNode } from '../../types';
import { renderNodeIcon } from '../../utils/iconMap';
import { FileText, Image, Video, Paperclip, Move } from 'lucide-react';

interface MindmapNodeMeshProps {
  node: MindmapNode;
  isSelected: boolean;
  isDetailOpen?: boolean;
  onSelect: (node: MindmapNode) => void;
  onClickNode: (node: MindmapNode) => void;
  onDoubleClick: (node: MindmapNode) => void;
  onContextMenu: (node: MindmapNode, x: number, y: number) => void;
  onPositionChange: (id: string, newPos: [number, number, number]) => void;
  onDragStateChange: (isDragging: boolean) => void;
}

export const MindmapNodeMesh: React.FC<MindmapNodeMeshProps> = ({
  node,
  isSelected,
  isDetailOpen = false,
  onSelect,
  onClickNode,
  onDoubleClick,
  onContextMenu,
  onPositionChange,
  onDragStateChange,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Subtle floating idle rotation or breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.4;
    }
    if (ringRef.current) {
      const t = state.clock.getElapsedTime();
      ringRef.current.rotation.z = -t * 0.6;
    }
  });

  // Handle Dragging in 3D using a camera-facing plane
  const startDragging = useCallback(
    (clientX: number, clientY: number, onDragEndCallback?: (didMove: boolean) => void) => {
      setIsDragging(true);
      onDragStateChange(true);

      const nodePos = new THREE.Vector3(...node.position);
      // Plane facing the camera
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir).negate();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, nodePos);
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const intersection = new THREE.Vector3();

      let didMoveFar = false;
      const startX = clientX;
      const startY = clientY;

      const handlePointerMove = (e: PointerEvent) => {
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (dist > 4) {
          didMoveFar = true;
        }

        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          onPositionChange(node.id, [
            parseFloat(intersection.x.toFixed(2)),
            parseFloat(intersection.y.toFixed(2)),
            parseFloat(intersection.z.toFixed(2)),
          ]);
        }
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        onDragStateChange(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        if (onDragEndCallback) {
          onDragEndCallback(didMoveFar);
        }
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [node.id, node.position, camera, gl.domElement, onPositionChange, onDragStateChange]
  );

  // Mesh 3D pointer down
  const handleMeshPointerDown = (e: any) => {
    e.stopPropagation();
    onSelect(node);
    if (e.button === 0) {
      pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      startDragging(e.nativeEvent.clientX, e.nativeEvent.clientY, (didMove) => {
        if (!didMove) {
          // Single left-click without drag -> bring to front / focus and expand
          onClickNode(node);
        }
      });
    }
  };

  // Single click on HTML overlay brings to front / focus & expands
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
    onClickNode(node);
  };

  // Double click handling
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDoubleClick(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(node, e.clientX, e.clientY);
  };

  // Has media indicators
  const hasMarkdown = Boolean(node.content?.markdown);
  const hasImage = Boolean(node.content?.imageUrl);
  const hasVideo = Boolean(node.content?.youtubeUrl);
  const hasAttachments = Boolean(node.content?.attachments && node.content.attachments.length > 0);

  const nodeColor = node.color || '#6366f1';

  return (
    <group position={node.position}>
      {/* Central 3D Node Mesh Sphere / Crystal */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
        onPointerDown={handleMeshPointerDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e: any) => {
          e.stopPropagation();
          handleContextMenu(e.nativeEvent);
        }}
      >
        <sphereGeometry args={[0.275, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isSelected ? 0.75 : isHovered ? 0.5 : 0.25}
          roughness={0.2}
          metalness={0.65}
        />
      </mesh>

      {/* Orbiting Halo Ring when Selected or Hovered */}
      {(isSelected || isHovered || isDragging) && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : nodeColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 2D HTML/CSS Spatial Overlay using Drei <Html> - hidden when expanded content panel is active */}
      {!isDetailOpen && (
        <Html
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
          style={{
            transform: 'translate3d(-50%, -130%, 0)',
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <div
            id={`node-card-${node.id}`}
            onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md border ${
              isSelected
                ? 'bg-slate-900/95 border-indigo-400 ring-2 ring-indigo-400/40 scale-105 shadow-indigo-500/25'
                : isDragging
                ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/30 scale-105'
                : isHovered
                ? 'bg-slate-900/90 border-slate-600 scale-102 shadow-xl'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
            style={{ minWidth: '140px', maxWidth: '240px' }}
          >
            {/* Node Icon Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner text-white"
              style={{ backgroundColor: nodeColor }}
            >
              {renderNodeIcon(node.icon, { size: 15, className: 'stroke-[2.5]' })}
            </div>

            {/* Node Text & Media badges */}
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="text-xs font-semibold text-slate-100 truncate tracking-wide leading-tight"
                title={node.title}
              >
                {node.title}
              </span>

              {/* Media presence indicator dots */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {hasMarkdown && (
                  <span title="Markdown Notes" className="text-slate-400 hover:text-slate-200">
                    <FileText size={10} />
                  </span>
                )}
                {hasImage && (
                  <span title="Image Attached" className="text-sky-400 hover:text-sky-300">
                    <Image size={10} />
                  </span>
                )}
                {hasVideo && (
                  <span title="YouTube Embed" className="text-red-400 hover:text-red-300">
                    <Video size={10} />
                  </span>
                )}
                {hasAttachments && (
                  <span title="File Attachments" className="text-emerald-400 hover:text-emerald-300">
                    <Paperclip size={10} />
                  </span>
                )}
              </div>
            </div>

            {/* 3D Drag Handle */}
            <button
              id={`drag-handle-${node.id}`}
              title="Drag in 3D space"
              onPointerDown={(e) => {
                e.stopPropagation();
                startDragging(e.clientX, e.clientY);
              }}
              className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing shrink-0"
            >
              <Move size={12} />
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};
