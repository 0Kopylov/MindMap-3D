import { MindmapNode } from '../types';

export function distance3D(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates an optimal 3D spatial coordinate near targetNode that avoids overlapping
 * with existing nodes.
 */
export function calculateOptimalPosition(
  targetNode: MindmapNode,
  existingNodes: MindmapNode[],
  type: 'child' | 'sibling' | 'parent'
): [number, number, number] {
  const minSpacing = 4.5;
  const targetPos = targetNode.position;

  if (type === 'parent') {
    // Parent should be placed inward (towards origin or before current node)
    let candidate: [number, number, number] = [
      targetPos[0] - 5,
      targetPos[1] + 1.5,
      targetPos[2] - 1
    ];

    if (targetNode.parentId) {
      const oldParent = existingNodes.find(n => n.id === targetNode.parentId);
      if (oldParent) {
        // Place midway with slight vertical offset
        candidate = [
          (targetPos[0] + oldParent.position[0]) / 2,
          (targetPos[1] + oldParent.position[1]) / 2 + 1.2,
          (targetPos[2] + oldParent.position[2]) / 2
        ];
      }
    }

    return resolveCollisions(candidate, existingNodes, minSpacing);
  }

  if (type === 'sibling') {
    // Sibling shares same parent
    const parent = existingNodes.find(n => n.id === targetNode.parentId);
    const siblings = existingNodes.filter(n => n.parentId === targetNode.parentId && n.id !== targetNode.id);
    
    // Choose an angle offset relative to parent or target
    const angleStep = Math.PI / 4;
    const baseAngle = siblings.length * angleStep + Math.PI / 6;
    const radius = 5.0;

    const origin = parent ? parent.position : targetPos;
    const candidate: [number, number, number] = [
      origin[0] + Math.cos(baseAngle) * radius + (parent ? 0 : 4.5),
      origin[1] + (siblings.length % 2 === 0 ? 1.5 : -1.5),
      origin[2] + Math.sin(baseAngle) * (radius * 0.8)
    ];

    return resolveCollisions(candidate, existingNodes, minSpacing);
  }

  // Type === 'child'
  const existingChildren = existingNodes.filter(n => n.parentId === targetNode.id);
  const count = existingChildren.length;
  
  // Distribute children in an expanding radial arc / spherical spiral
  const phi = count * 0.8 + 0.3; // azimuthal angle
  const elevation = ((count % 3) - 1) * 1.8; // vertical dispersion
  const dist = 5.5 + Math.floor(count / 5) * 2; // radius expansion if many children

  const candidate: [number, number, number] = [
    targetPos[0] + Math.cos(phi) * dist,
    targetPos[1] + elevation,
    targetPos[2] + Math.sin(phi) * dist * 0.7
  ];

  return resolveCollisions(candidate, existingNodes, minSpacing);
}

/**
 * Adjusts candidate position if too close to any existing node
 */
function resolveCollisions(
  candidate: [number, number, number],
  existingNodes: MindmapNode[],
  minDistance: number
): [number, number, number] {
  let [x, y, z] = candidate;
  let attempts = 0;
  const maxAttempts = 12;

  while (attempts < maxAttempts) {
    let conflict = false;
    for (const node of existingNodes) {
      const d = distance3D([x, y, z], node.position);
      if (d < minDistance) {
        conflict = true;
        // Push outwards along vector
        const angle = (attempts + 1) * (Math.PI / 3);
        x += Math.cos(angle) * (minDistance - d + 1.2);
        y += ((attempts % 2 === 0 ? 1 : -1) * 1.5);
        z += Math.sin(angle) * (minDistance - d + 1.0);
        break;
      }
    }
    if (!conflict) break;
    attempts++;
  }

  return [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2))];
}

/**
 * Computes Bezier curve control points between parent and child for organic 3D branches
 */
export function computeBezierControlPoints(
  start: [number, number, number],
  end: [number, number, number]
): { midA: [number, number, number]; midB: [number, number, number] } {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];

  // Curve smoothly along the dominant direction
  const midA: [number, number, number] = [
    start[0] + dx * 0.4,
    start[1] + dy * 0.1,
    start[2] + dz * 0.4
  ];

  const midB: [number, number, number] = [
    start[0] + dx * 0.6,
    end[1] - dy * 0.1,
    start[2] + dz * 0.6
  ];

  return { midA, midB };
}
