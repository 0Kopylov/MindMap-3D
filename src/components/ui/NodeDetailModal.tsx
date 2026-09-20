import React, { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import { MindmapNode, MindmapAttachment } from '../../types';
import { renderNodeIcon, AVAILABLE_ICONS } from '../../utils/iconMap';
import { formatBytes } from '../../utils/mediaUtils';
import {
  X,
  Paperclip,
  FileText,
  Upload,
  Trash2,
  Focus,
  Plus,
  ExternalLink,
  Download,
  Palette,
  RotateCcw
} from 'lucide-react';

interface NodeDetailModalProps {
  node: MindmapNode | null;
  onClose: () => void;
  onUpdateNode: (updated: MindmapNode) => void;
  onFocusNode: (node: MindmapNode) => void;
  onCreateChildNode: (parentNode: MindmapNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

interface ModalSize {
  width: number;
  height: number;
}

const DEFAULT_MODAL_SIZE: ModalSize = { width: 672, height: 560 };
const MODAL_SIZE_STORAGE_KEY = 'mindmap_expanded_view_default_size';

function getInitialModalSize(): ModalSize {
  try {
    const raw = localStorage.getItem(MODAL_SIZE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        const maxWidth = typeof window !== 'undefined' ? Math.max(360, window.innerWidth - 32) : 1400;
        const maxHeight = typeof window !== 'undefined' ? Math.max(280, window.innerHeight - 32) : 1000;
        return {
          width: Math.min(Math.max(360, Math.round(parsed.width)), maxWidth),
          height: Math.min(Math.max(280, Math.round(parsed.height)), maxHeight),
        };
      }
    }
  } catch (err) {
    console.error('Failed to read default modal size:', err);
  }
  if (typeof window !== 'undefined') {
    return {
      width: Math.min(DEFAULT_MODAL_SIZE.width, Math.max(360, window.innerWidth - 32)),
      height: Math.min(DEFAULT_MODAL_SIZE.height, Math.max(280, window.innerHeight - 32)),
    };
  }
  return DEFAULT_MODAL_SIZE;
}

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  onClose,
  onUpdateNode,
  onFocusNode,
  onCreateChildNode,
  onDeleteNode,
}) => {
  if (!node) return null;

  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);

  // Persistent default size across all nodes
  const [modalSize, setModalSize] = useState<ModalSize>(getInitialModalSize);
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const justResizedRef = useRef(false);

  // Resize handler supporting bottom-right, bottom-left, right, bottom, and left edges
  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: 'se' | 'e' | 's' | 'w' | 'sw'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);
    justResizedRef.current = true;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const maxWidth = Math.max(360, window.innerWidth - 32);
      const maxHeight = Math.max(280, window.innerHeight - 32);

      let nextWidth = startWidth;
      let nextHeight = startHeight;

      if (direction === 'se' || direction === 'e') {
        const halfW = moveEvent.clientX - centerX;
        nextWidth = Math.min(Math.max(360, halfW * 2), maxWidth);
      } else if (direction === 'w' || direction === 'sw') {
        const halfW = centerX - moveEvent.clientX;
        nextWidth = Math.min(Math.max(360, halfW * 2), maxWidth);
      }

      if (direction === 'se' || direction === 's' || direction === 'sw') {
        const halfH = moveEvent.clientY - centerY;
        nextHeight = Math.min(Math.max(280, halfH * 2), maxHeight);
      }

      const rounded = {
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      };

      setModalSize(rounded);
      // Persist immediately as the new default size for all nodes
      try {
        localStorage.setItem(MODAL_SIZE_STORAGE_KEY, JSON.stringify(rounded));
      } catch {
        // ignore
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      try {
        targetEl.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsResizing(false);
      justResizedRef.current = true;
      setTimeout(() => {
        justResizedRef.current = false;
      }, 350);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleResetSize = () => {
    setModalSize(DEFAULT_MODAL_SIZE);
    try {
      localStorage.setItem(MODAL_SIZE_STORAGE_KEY, JSON.stringify(DEFAULT_MODAL_SIZE));
    } catch {
      // ignore
    }
  };

  // Handlers for updating node properties
  const handleTitleChange = (newTitle: string) => {
    onUpdateNode({ ...node, title: newTitle });
  };

  const handleColorChange = (newColor: string) => {
    onUpdateNode({ ...node, color: newColor });
  };

  const handleIconChange = (newIcon: string) => {
    onUpdateNode({ ...node, icon: newIcon });
    setShowIconPicker(false);
  };

  const handleMarkdownChange = (val: string) => {
    onUpdateNode({
      ...node,
      content: { ...node.content, markdown: val }
    });
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: MindmapAttachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    }));

    const current = node.content.attachments || [];
    onUpdateNode({
      ...node,
      content: {
        ...node.content,
        attachments: [...current, ...newAttachments]
      }
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    const current = node.content.attachments || [];
    onUpdateNode({
      ...node,
      content: {
        ...node.content,
        attachments: current.filter((a) => a.id !== attId)
      }
    });
  };

  return (
    <div
      id="node-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResizing && !justResizedRef.current) {
          onClose();
        }
      }}
    >
      <div
        id="node-detail-modal-content"
        ref={modalRef}
        style={{
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          userSelect: isResizing ? 'none' : 'auto',
        }}
        className={`relative bg-slate-900 border ${
          isResizing ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700/80'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon & Color trigger */}
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Click to customize icon"
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md hover:scale-105 transition-transform"
              style={{ backgroundColor: node.color || '#6366f1' }}
            >
              {renderNodeIcon(node.icon, { size: 20, className: 'stroke-[2.2]' })}
            </button>

            {/* Editable Title */}
            <input
              type="text"
              value={node.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg sm:text-xl font-bold bg-transparent text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors w-full px-1 py-0.5"
              placeholder="Node Title..."
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Reset Size Button / Dimensions indicator */}
            <button
              onClick={handleResetSize}
              title={`Reset to standard size (Current default: ${modalSize.width}×${modalSize.height}px)`}
              className="p-1.5 sm:px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs border border-slate-700/50"
            >
              <RotateCcw size={13} />
              <span className="font-mono text-[11px] text-slate-400">
                {modalSize.width}×{modalSize.height}
              </span>
            </button>

            <button
              onClick={() => onFocusNode(node)}
              title="Focus 3D Camera"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
            >
              <Focus size={15} />
              <span className="hidden sm:inline">Focus 3D</span>
            </button>

            <button
              onClick={() => onCreateChildNode(node)}
              title="Add Child Node"
              className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Child</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Icon & Color Picker Dropdown Popover */}
        {showIconPicker && (
          <div className="p-4 bg-slate-800/95 border-b border-slate-700 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Select Accent Color</span>
              <button
                onClick={() => setShowIconPicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            {/* Color Swatches */}
            <div className="flex items-center gap-2 mb-4">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    node.color === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Select Icon</div>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-lg">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => handleIconChange(iconName)}
                  title={iconName}
                  className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                    node.icon === iconName
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {renderNodeIcon(iconName, { size: 16 })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Body: 90% Markdown Workspace + Streamlined Footer */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Notes / Markdown Section - Occupies 90% of expanded view window */}
          <div className="flex-1 min-h-0 flex flex-col">
            {isEditingMarkdown ? (
              <div className="flex-1 min-h-0 flex flex-col h-full space-y-1.5">
                <textarea
                  autoFocus
                  value={node.content.markdown || ''}
                  onChange={(e) => handleMarkdownChange(e.target.value)}
                  onDoubleClick={() => setIsEditingMarkdown(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingMarkdown(false);
                    }
                  }}
                  placeholder="Type notes using Markdown (e.g., # Heading, - Bullet point, **bold**)... Double-click or press Esc to return to preview mode."
                  className="w-full flex-1 min-h-0 bg-slate-950 border border-indigo-500/60 ring-2 ring-indigo-500/20 rounded-xl p-4 text-sm text-slate-100 font-mono focus:outline-none transition-all leading-relaxed resize-none overflow-y-auto"
                  title="Double left-click or press Esc to preview"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 shrink-0">
                  <span>Double left-click or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> to preview</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingMarkdown(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div
                id={`node-notes-preview-${node.id}`}
                onDoubleClick={() => setIsEditingMarkdown(true)}
                title="Double left-click to edit notes"
                className="flex-1 min-h-0 p-4 sm:p-5 bg-slate-950/60 hover:bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700/80 text-slate-200 leading-relaxed text-sm cursor-text transition-colors overflow-y-auto group select-text flex flex-col"
              >
                {node.content.markdown ? (
                  <div className="prose prose-invert prose-sm max-w-none space-y-2 flex-1">
                    <Markdown>{node.content.markdown}</Markdown>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-500 select-none">
                    <FileText size={32} className="mb-2 opacity-35 text-indigo-400" />
                    <p className="text-sm text-slate-400 font-medium">Double left-click to write notes...</p>
                    <p className="text-xs text-slate-600 mt-1">Supports Markdown formatting</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Attachments Drawer (Collapsible) */}
          {showAttachmentsDrawer && (
            <div className="shrink-0 p-3 bg-slate-950/90 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Paperclip size={13} className="text-emerald-400" />
                  Attached Files ({node.content.attachments?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAttachmentsDrawer(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Close
                </button>
              </div>
              {node.content.attachments && node.content.attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {node.content.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-slate-200 truncate max-w-xs">{att.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{att.size}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {att.url && (
                          <a
                            href={att.url}
                            download={att.name}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Download"
                          >
                            <Download size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-2 text-slate-500 text-xs">No files attached yet.</p>
              )}
            </div>
          )}

          {/* Compact Bottom Bar (Remaining ~10%) */}
          <div className="shrink-0 pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachmentsDrawer(!showAttachmentsDrawer)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  showAttachmentsDrawer
                    ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-300'
                    : node.content.attachments && node.content.attachments.length > 0
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paperclip size={13} className="text-emerald-400" />
                <span>Files ({node.content.attachments?.length || 0})</span>
              </button>

              <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors">
                <Upload size={12} />
                <span>Attach</span>
                <input
                  type="file"
                  multiple
                  onChange={handleAddAttachment}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <span>Pos:</span>
                <span className="text-indigo-400">{node.position[0]}</span>,
                <span className="text-emerald-400">{node.position[1]}</span>,
                <span className="text-sky-400">{node.position[2]}</span>
              </div>

              <button
                onClick={() => {
                  onDeleteNode(node.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Resize Handles */}
        {/* Right Edge Handle */}
        <div
          onPointerDown={(e) => handleResizeStart(e, 'e')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Drag to resize width (default for all nodes)"
          className="absolute top-12 right-0 bottom-6 w-2.5 cursor-e-resize hover:bg-indigo-500/25 active:bg-indigo-500/40 transition-colors z-20"
        />

        {/* Left Edge Handle */}
        <div
          onPointerDown={(e) => handleResizeStart(e, 'w')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Drag to resize width (default for all nodes)"
          className="absolute top-12 left-0 bottom-6 w-2.5 cursor-w-resize hover:bg-indigo-500/25 active:bg-indigo-500/40 transition-colors z-20"
        />

        {/* Bottom Edge Handle */}
        <div
          onPointerDown={(e) => handleResizeStart(e, 's')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Drag to resize height (default for all nodes)"
          className="absolute bottom-0 left-6 right-6 h-2.5 cursor-s-resize hover:bg-indigo-500/25 active:bg-indigo-500/40 transition-colors z-20"
        />

        {/* Bottom-Right Corner Grip */}
        <div
          onPointerDown={(e) => handleResizeStart(e, 'se')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Drag to resize expanded view (becomes default size for all nodes)"
          className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1.5 cursor-se-resize text-slate-500 hover:text-indigo-400 active:text-indigo-300 select-none z-30 group"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:scale-125">
            <path d="M10 3L3 10M10 7L7 10M10 10.5L9.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Bottom-Left Corner Grip */}
        <div
          onPointerDown={(e) => handleResizeStart(e, 'sw')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Drag to resize expanded view (becomes default size for all nodes)"
          className="absolute bottom-0 left-0 w-7 h-7 flex items-end justify-start p-1.5 cursor-sw-resize text-slate-500 hover:text-indigo-400 active:text-indigo-300 select-none z-30 group"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:scale-125">
            <path d="M2 3L9 10M2 7L5 10M2 10.5L2.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Resizing Badge Indicator */}
        {isResizing && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-mono text-[11px] px-2.5 py-0.5 rounded-full shadow-lg pointer-events-none z-40 animate-pulse">
            {modalSize.width} × {modalSize.height} px (New Default)
          </div>
        )}
      </div>
    </div>
  );
};
