import { MindmapNode } from '../types';

export const INITIAL_NODES: MindmapNode[] = [
  {
    id: 'root-1',
    title: '3D Spatial Mindmap',
    icon: 'Brain',
    color: '#6366f1', // Indigo
    position: [0, 0, 0],
    parentId: null,
    content: {
      markdown: `### Welcome to the 3D Mindmap Canvas

This application provides a **full spatial canvas** for organizing ideas, system architectures, and knowledge graphs in 3D WebGL space.

#### Quick Interactions:
- **Left-Click + Drag Canvas**: Rotate & orbit 3D camera
- **Right-Click + Drag Canvas**: Pan camera
- **Scroll**: Zoom in/out
- **Left-Click + Drag on Node**: Drag node in 3D camera plane
- **Double-Click Node**: Smooth camera focus & open rich multimedia inspector
- **Right-Click Node**: Open floating Context Menu (*Create Child, Sibling, Parent*)
      `,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      attachments: [
        { id: 'att-1', name: 'Spatial_Mindmap_Specification.pdf', size: '1.4 MB', type: 'application/pdf' },
        { id: 'att-2', name: 'ThreeJS_Architecture_Diagram.png', size: '640 KB', type: 'image/png' }
      ]
    }
  },
  {
    id: 'node-webgl',
    title: 'WebGL & Three.js Engine',
    icon: 'Atom',
    color: '#06b6d4', // Cyan
    position: [-5.5, 2.0, 3.0],
    parentId: 'root-1',
    content: {
      markdown: `### R3F + Three.js Graphics Pipeline

- **@react-three/fiber**: Declarative React reconciler for Three.js
- **@react-three/drei**: High-performance spatial helpers, HTML billboarding, and CubicBezierLine shaders
- **Smooth Lerp Interpolation**: Camera transitions with dampening for cinematic focus

\`\`\`ts
// Camera focus interpolation
camera.position.lerp(targetPos, 0.08);
controls.target.lerp(targetLookAt, 0.08);
\`\`\`
`,
      imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80'
    }
  },
  {
    id: 'node-multimedia',
    title: 'Rich Media & Embeds',
    icon: 'Video',
    color: '#f59e0b', // Amber
    position: [6.0, 1.8, 2.5],
    parentId: 'root-1',
    content: {
      markdown: `### Rich Multimedia Node Content

Nodes can house interactive media directly inside the spatial context:
- **Markdown & Code**: Formatted documentation and syntax
- **Embedded Videos**: Native YouTube iframe overlay
- **Image Previews**: High-resolution gallery & uploaded visual notes
- **File Attachments**: Direct document downloads
`,
      youtubeUrl: 'https://www.youtube.com/watch?v=k4t2U8uX6q4', // Three.js Journey demo video
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
      attachments: [
        { id: 'att-3', name: 'Interactive_Showcase_Notes.md', size: '24 KB', type: 'text/markdown' },
        { id: 'att-4', name: 'Spatial_Shader_Passes.glsl', size: '8 KB', type: 'text/plain' }
      ]
    }
  },
  {
    id: 'node-drag',
    title: '3D Spatial Drag & Drop',
    icon: 'Workflow',
    color: '#10b981', // Emerald
    position: [-5.0, -3.0, -2.5],
    parentId: 'root-1',
    content: {
      markdown: `### Plane-Projected Raycasting

Drag any node sphere or tag to reposition it anywhere in 3D:
1. When drag starts, a virtual plane facing the active camera vector is established at the node position.
2. Pointer movements cast rays into the plane, updating the node coordinate.
3. OrbitControls are seamlessly disengaged during dragging to prevent jitter.
4. All connected parent and child Bezier splines update in real time.
`
    }
  },
  {
    id: 'node-topology',
    title: 'Tree Topology & Context Menus',
    icon: 'Network',
    color: '#ec4899', // Pink / Rose
    position: [5.2, -2.8, -3.0],
    parentId: 'root-1',
    content: {
      markdown: `### Hierarchical Graph Operations

Right-click any node to reveal topological branching:
- **Create Child Node**: Computes non-overlapping radial dispersion angles
- **Create Sibling Node**: Shares parent node, balancing the branch tree
- **Create Parent Node**: Inserts an intermediate ancestral node and rebinds edges
`
    }
  },
  {
    id: 'node-shaders',
    title: 'Dynamic Bezier Splines',
    icon: 'Zap',
    color: '#8b5cf6', // Violet
    position: [-9.5, 3.8, 4.5],
    parentId: 'node-webgl',
    content: {
      markdown: `### Curved Cubic Bezier Connections

Connections between parent and child nodes are rendered as smooth cubic Bezier splines that dynamically follow node displacements:

- Start: Parent node 3D vector
- End: Child node 3D vector
- Tangent Control Points: Computed in 3D with curvature offsets
`
    }
  },
  {
    id: 'node-xr',
    title: 'Spatial AI & Vision Pro',
    icon: 'Rocket',
    color: '#3b82f6', // Blue
    position: [9.8, 3.5, 4.0],
    parentId: 'node-multimedia',
    content: {
      markdown: `### Next-Gen Spatial Interfaces

Exploring intuitive spatial memory, floating holographic canvas nodes, and seamless gestures in WebXR environments.
`
    }
  }
];
