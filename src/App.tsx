/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MindmapNode, ContextMenuState, CameraFocusTarget } from './types';
import { INITIAL_NODES } from './data/initialMindmap';
import { MindmapCanvas } from './components/3d/MindmapCanvas';
import { ContextMenu } from './components/ui/ContextMenu';
import { NodeDetailModal } from './components/ui/NodeDetailModal';
import { MindmapToolbar } from './components/ui/MindmapToolbar';
import { calculateOptimalPosition } from './utils/spatialMath';
import { calculateRadialLayout } from './utils/layoutAlgorithm';

const STORAGE_KEY = '3d_mindmap_nodes_v1';

export default function App() {
  // Load saved nodes or default initial nodes
  const [nodes, setNodes] = useState<MindmapNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load nodes from storage, using initial preset', e);
    }
    return INITIAL_NODES;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailNode, setDetailNode] = useState<MindmapNode | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [focusTarget, setFocusTarget] = useState<CameraFocusTarget | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  const controlsRef = useRef<any>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    } catch (e) {
      console.warn('Could not save nodes to storage', e);
    }
  }, [nodes]);

  // Keep detailNode updated if the underlying node changes
  useEffect(() => {
    if (detailNode) {
      const current = nodes.find((n) => n.id === detailNode.id);
      if (current) {
        setDetailNode(current);
      } else {
        setDetailNode(null);
      }
    }
  }, [nodes, detailNode?.id]);

  // Focus Camera smoothly on a specific node
  const handleFocusNode = useCallback((node: MindmapNode) => {
    setSelectedNodeId(node.id);
    setFocusTarget({
      position: [
        node.position[0],
        node.position[1] + 1.8,
        node.position[2] + 7.5,
      ],
      target: [...node.position],
      active: true,
    });
  }, []);

  // Single Left-Click Handler: Expand rich content panel
  const handleClickNode = useCallback(
    (node: MindmapNode) => {
      setSelectedNodeId(node.id);
      setDetailNode(node);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    },
    []
  );

  // Double Click Handler (also supported)
  const handleDoubleClickNode = useCallback(
    (node: MindmapNode) => {
      handleClickNode(node);
    },
    [handleClickNode]
  );

  // Right Click Context Menu
  const handleContextMenuNode = useCallback(
    (node: MindmapNode, clientX: number, clientY: number) => {
      setSelectedNodeId(node.id);
      setContextMenu({
        visible: true,
        x: clientX,
        y: clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Node Position Change (live during 3D drag-and-drop)
  const handleNodePositionChange = useCallback(
    (id: string, newPos: [number, number, number]) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === id ? { ...node, position: newPos } : node
        )
      );
    },
    []
  );

  // Topological Node Creation: Child, Sibling, or Parent
  const handleCreateNode = useCallback(
    (targetNode: MindmapNode, type: 'child' | 'sibling' | 'parent') => {
      const newId = `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const optimalPos = calculateOptimalPosition(targetNode, nodes, type);

      if (type === 'parent') {
        const oldParentId = targetNode.parentId;
        const newParentNode: MindmapNode = {
          id: newId,
          title: `Parent of ${targetNode.title}`,
          icon: 'Layers',
          color: targetNode.color,
          position: optimalPos,
          parentId: oldParentId,
          content: {
            markdown: `### Parent Category: ${targetNode.title}\n\nGroup notes and overarching architectural thoughts here.`,
          },
        };

        setNodes((prev) => [
          ...prev.map((n) => (n.id === targetNode.id ? { ...n, parentId: newId } : n)),
          newParentNode,
        ]);

        handleFocusNode(newParentNode);
        setDetailNode(newParentNode);
        return;
      }

      if (type === 'sibling') {
        const newSibling: MindmapNode = {
          id: newId,
          title: `Sibling of ${targetNode.title}`,
          icon: targetNode.icon || 'Sparkles',
          color: targetNode.color,
          position: optimalPos,
          parentId: targetNode.parentId,
          content: {
            markdown: `### Sibling Idea\n\nRelated to **${targetNode.title}**.`,
          },
        };

        setNodes((prev) => [...prev, newSibling]);
        handleFocusNode(newSibling);
        setDetailNode(newSibling);
        return;
      }

      // type === 'child'
      const newChild: MindmapNode = {
        id: newId,
        title: `Branch: ${targetNode.title}`,
        icon: 'Sparkles',
        color: targetNode.color,
        position: optimalPos,
        parentId: targetNode.id,
        content: {
          markdown: `### Sub-topic of ${targetNode.title}\n\nDocument specific findings, sub-components, or requirements here.`,
        },
      };

      setNodes((prev) => [...prev, newChild]);
      handleFocusNode(newChild);
      setDetailNode(newChild);
    },
    [nodes, handleFocusNode]
  );

  // Add a new node from global toolbar
  const handleAddNewNode = useCallback(() => {
    const selected = nodes.find((n) => n.id === selectedNodeId);
    if (selected) {
      handleCreateNode(selected, 'child');
    } else {
      // Create a new root cluster node
      const rootNode = nodes[0] || {
        position: [0, 0, 0],
        color: '#6366f1',
        title: 'Central Topic',
      };
      const newId = `node-${Date.now().toString(36)}`;
      const optimalPos = calculateOptimalPosition(rootNode as MindmapNode, nodes, 'child');
      const newNode: MindmapNode = {
        id: newId,
        title: 'New Idea',
        icon: 'Lightbulb',
        color: '#8b5cf6',
        position: optimalPos,
        parentId: nodes.length > 0 ? nodes[0].id : null,
        content: {
          markdown: `### New Mindmap Idea\n\nDouble-click to edit or format notes.`,
        },
      };
      setNodes((prev) => [...prev, newNode]);
      handleFocusNode(newNode);
      setDetailNode(newNode);
    }
  }, [nodes, selectedNodeId, handleCreateNode, handleFocusNode]);

  // Update existing node properties
  const handleUpdateNode = useCallback((updated: MindmapNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setDetailNode(updated);
  }, []);

  // Delete node and reassign children to deleted node's parent
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) return;

      const parentOfDeleted = nodeToDelete.parentId;

      setNodes((prev) =>
        prev
          .filter((n) => n.id !== nodeId)
          .map((n) => (n.parentId === nodeId ? { ...n, parentId: parentOfDeleted } : n))
      );

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      if (detailNode?.id === nodeId) {
        setDetailNode(null);
      }
    },
    [nodes, selectedNodeId, detailNode]
  );

  // Auto layout
  const handleAutoLayout = useCallback(() => {
    setNodes((prev) => calculateRadialLayout(prev));
    handleResetCamera();
  }, []);

  // Reset to default sample
  const handleResetDefault = useCallback(() => {
    setNodes(INITIAL_NODES);
    setSelectedNodeId(null);
    setDetailNode(null);
    handleResetCamera();
  }, []);

  // Camera toolbar operations
  const handleResetCamera = useCallback(() => {
    setFocusTarget({
      position: [0, 8, 22],
      target: [0, 0, 0],
      active: true,
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      const cam = controlsRef.current.object;
      cam.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      const cam = controlsRef.current.object;
      cam.position.multiplyScalar(1.25);
      controlsRef.current.update();
    }
  }, []);

  return (
    <div id="mindmap-app-root" className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans text-slate-100">
      {/* 3D WebGL Canvas */}
      <MindmapCanvas
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        focusTarget={focusTarget}
        isDraggingNode={isDraggingNode}
        isDetailOpen={Boolean(detailNode)}
        onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
        onClickNode={handleClickNode}
        onDoubleClickNode={handleDoubleClickNode}
        onContextMenuNode={handleContextMenuNode}
        onNodePositionChange={handleNodePositionChange}
        onDragStateChange={setIsDraggingNode}
        onFocusComplete={() => setFocusTarget((prev) => (prev ? { ...prev, active: false } : null))}
        controlsRef={controlsRef}
      />

      {/* Top and Bottom UI Chrome */}
      <MindmapToolbar
        nodes={nodes}
        onResetCamera={handleResetCamera}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAddNewNode={handleAddNewNode}
        onSelectNode={(node) => handleFocusNode(node)}
        onAutoLayout={handleAutoLayout}
        onResetDefault={handleResetDefault}
      />

      {/* Floating 3D Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        nodes={nodes}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        onCreateNode={handleCreateNode}
        onOpenDetail={(node) => setDetailNode(node)}
        onFocusNode={handleFocusNode}
        onDeleteNode={handleDeleteNode}
      />

      {/* Expanded Rich Content Modal */}
      <NodeDetailModal
        node={detailNode}
        onClose={() => setDetailNode(null)}
        onUpdateNode={handleUpdateNode}
        onFocusNode={handleFocusNode}
        onCreateChildNode={(parent) => handleCreateNode(parent, 'child')}
        onDeleteNode={handleDeleteNode}
      />
    </div>
  );
}
