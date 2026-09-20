import React, { useEffect, useRef } from 'react';
import { ContextMenuState, MindmapNode } from '../../types';
import {
  GitFork,
  GitCommit,
  GitPullRequest,
  ExternalLink,
  Trash2,
  Focus,
  Plus
} from 'lucide-react';

interface ContextMenuProps {
  contextMenu: ContextMenuState;
  nodes: MindmapNode[];
  onClose: () => void;
  onCreateNode: (targetNode: MindmapNode, type: 'child' | 'sibling' | 'parent') => void;
  onOpenDetail: (node: MindmapNode) => void;
  onFocusNode: (node: MindmapNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  nodes,
  onClose,
  onCreateNode,
  onOpenDetail,
  onFocusNode,
  onDeleteNode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetNode = nodes.find((n) => n.id === contextMenu.nodeId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!contextMenu.visible || !targetNode) return null;

  // Viewport clamping
  const menuWidth = 230;
  const menuHeight = 270;
  const x = Math.min(contextMenu.x, window.innerWidth - menuWidth - 16);
  const y = Math.min(contextMenu.y, window.innerHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      id="node-context-menu"
      style={{ left: `${Math.max(12, x)}px`, top: `${Math.max(12, y)}px` }}
      className="fixed z-50 w-56 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Target Node Header */}
      <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
        <span className="font-semibold text-slate-300 truncate max-w-[140px]" title={targetNode.title}>
          {targetNode.title}
        </span>
        <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          Node
        </span>
      </div>

      {/* Topology Actions */}
      <div className="space-y-0.5">
        <button
          id="action-create-child"
          onClick={() => {
            onCreateNode(targetNode, 'child');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 transition-colors text-left"
        >
          <GitFork size={14} className="text-indigo-400" />
          <span>Create Child Node</span>
        </button>

        <button
          id="action-create-sibling"
          onClick={() => {
            onCreateNode(targetNode, 'sibling');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/20 hover:text-sky-300 text-slate-300 transition-colors text-left"
        >
          <GitCommit size={14} className="text-sky-400" />
          <span>Create Sibling Node</span>
        </button>

        <button
          id="action-create-parent"
          onClick={() => {
            onCreateNode(targetNode, 'parent');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600/20 hover:text-purple-300 text-slate-300 transition-colors text-left"
        >
          <GitPullRequest size={14} className="text-purple-400" />
          <span>Create Parent Node</span>
        </button>
      </div>

      <div className="my-1 border-t border-slate-800/80" />

      {/* Inspection & Navigation Actions */}
      <div className="space-y-0.5">
        <button
          id="action-open-detail"
          onClick={() => {
            onOpenDetail(targetNode);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors text-left"
        >
          <ExternalLink size={14} className="text-amber-400" />
          <span>Expand Content Panel</span>
        </button>

        <button
          id="action-focus-camera"
          onClick={() => {
            onFocusNode(targetNode);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors text-left"
        >
          <Focus size={14} className="text-emerald-400" />
          <span>Focus 3D Camera</span>
        </button>

        <button
          id="action-delete-node"
          onClick={() => {
            onDeleteNode(targetNode.id);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 hover:text-rose-400 text-rose-300 transition-colors text-left"
        >
          <Trash2 size={14} />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
};
