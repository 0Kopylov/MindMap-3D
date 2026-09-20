import React, { useState } from 'react';
import { MindmapNode } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Search,
  Layers,
  HelpCircle,
  Network,
  Sparkles,
  Download,
  Upload
} from 'lucide-react';

interface MindmapToolbarProps {
  nodes: MindmapNode[];
  onResetCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddNewNode: () => void;
  onSelectNode: (node: MindmapNode) => void;
  onAutoLayout: () => void;
  onResetDefault: () => void;
}

export const MindmapToolbar: React.FC<MindmapToolbarProps> = ({
  nodes,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  onAddNewNode,
  onSelectNode,
  onAutoLayout,
  onResetDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const filteredNodes = searchQuery.trim()
    ? nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content?.markdown?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', '3d-mindmap.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* App Title & Node Count */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Network size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              3D Mindmap
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                WebGL
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {nodes.length} Nodes • {nodes.filter((n) => n.parentId).length} Bezier Splines
            </p>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="relative pointer-events-auto max-w-xs sm:max-w-sm w-full mx-2">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl focus-within:border-indigo-500 transition-colors">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search 3D nodes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 max-h-56 overflow-y-auto space-y-1">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onSelectNode(n);
                      setShowSearchDropdown(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      [{n.position.join(', ')}]
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  No matching nodes found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowHelpModal(true)}
            title="Interaction Guide & Shortcuts"
            className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl transition-colors"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={onAddNewNode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Node</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom Left Navigation Dock */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut size={16} />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        <button
          onClick={onResetCamera}
          title="Reset Camera View"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={onAutoLayout}
          title="Auto Radial Layout"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Layers size={16} />
        </button>

        <button
          onClick={handleExportJson}
          title="Export Mindmap JSON"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Floating Bottom Center Quick Tip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-400 pointer-events-none shadow-lg">
        <span><strong className="text-slate-200">Drag Node:</strong> 3D Reposition</span>
        <span className="text-slate-600">•</span>
        <span><strong className="text-slate-200">Click Node:</strong> Focus & View Content</span>
        <span className="text-slate-600">•</span>
        <span><strong className="text-slate-200">Right-Click:</strong> Context Menu</span>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-400" />
                3D Mindmap Navigation Guide
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-indigo-300 block mb-1">Camera Orbit & Pan</strong>
                <p className="text-slate-400">Left-click and drag on empty canvas to rotate. Right-click and drag to pan. Scroll wheel zooms in and out.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-300 block mb-1">3D Node Drag & Drop</strong>
                <p className="text-slate-400">Click and drag any 3D node sphere or drag handle. The node moves along a plane facing your active camera angle, smoothly recalculating Bezier splines in real time.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-amber-300 block mb-1">Single-Click Focus & Expansion</strong>
                <p className="text-slate-400">Left-clicking any node brings it to front, triggers a smooth camera focus transition (GSAP/Three.js lerp), and expands its rich content modal (Markdown notes, images, YouTube embeds, file attachments).</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-sky-300 block mb-1">Context Menu & Topology</strong>
                <p className="text-slate-400">Right-click any node to reveal the floating context menu to create Child, Sibling, or Parent nodes with automatic 3D collision avoidance.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button
                onClick={onResetDefault}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Reset Default Demo Map
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
