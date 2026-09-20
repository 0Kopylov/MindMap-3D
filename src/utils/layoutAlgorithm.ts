import { MindmapNode } from '../types';

/**
 * Arranges nodes into a clean radial hierarchical 3D mindmap layout
 */
export function calculateRadialLayout(nodes: MindmapNode[]): MindmapNode[] {
  if (nodes.length === 0) return [];

  const updatedNodes = [...nodes];
  const nodeMap = new Map<string, MindmapNode>();
  const childrenMap = new Map<string, string[]>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n });
    if (!childrenMap.has(n.id)) {
      childrenMap.set(n.id, []);
    }
  });

  nodes.forEach((n) => {
    if (n.parentId && childrenMap.has(n.parentId)) {
      childrenMap.get(n.parentId)!.push(n.id);
    }
  });

  // Find root nodes
  const rootNodes = nodes.filter((n) => !n.parentId || !nodeMap.has(n.parentId));
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes.push(nodes[0]);
  }

  // Position root node(s)
  rootNodes.forEach((root, idx) => {
    const rootPos: [number, number, number] = [
      (idx - (rootNodes.length - 1) / 2) * 12,
      0,
      0,
    ];
    const n = nodeMap.get(root.id);
    if (n) n.position = rootPos;

    layoutSubtree(root.id, rootPos, 0, Math.PI * 2, 1, nodeMap, childrenMap);
  });

  return Array.from(nodeMap.values());
}

function layoutSubtree(
  parentId: string,
  parentPos: [number, number, number],
  startAngle: number,
  endAngle: number,
  depth: number,
  nodeMap: Map<string, MindmapNode>,
  childrenMap: Map<string, string[]>
) {
  const children = childrenMap.get(parentId) || [];
  if (children.length === 0) return;

  const count = children.length;
  const radius = depth === 1 ? 6.5 : 5.0;
  const angleStep = (endAngle - startAngle) / count;

  children.forEach((childId, i) => {
    const childNode = nodeMap.get(childId);
    if (!childNode) return;

    const angle = startAngle + angleStep * (i + 0.5);
    // Slight vertical wave for 3D depth
    const elevation = Math.sin(angle * 2) * 1.8 + (depth % 2 === 0 ? 1 : -1) * 0.8;

    const childPos: [number, number, number] = [
      parseFloat((parentPos[0] + Math.cos(angle) * radius).toFixed(2)),
      parseFloat((parentPos[1] + elevation).toFixed(2)),
      parseFloat((parentPos[2] + Math.sin(angle) * radius * 0.75).toFixed(2)),
    ];

    childNode.position = childPos;

    // Subtree angle range concentrated in child's sector
    const sectorSpread = Math.min(Math.PI, angleStep * 1.2);
    const subStart = angle - sectorSpread / 2;
    const subEnd = angle + sectorSpread / 2;

    layoutSubtree(childId, childPos, subStart, subEnd, depth + 1, nodeMap, childrenMap);
  });
}
