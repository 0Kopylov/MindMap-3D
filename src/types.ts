export interface MindmapAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface MindmapNodeContent {
  markdown?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  attachments?: MindmapAttachment[];
}

export interface MindmapNode {
  id: string;
  title: string;
  icon: string;
  color: string;
  position: [number, number, number];
  parentId: string | null;
  content: MindmapNodeContent;
  isExpanded?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

export interface CameraFocusTarget {
  position: [number, number, number];
  target: [number, number, number];
  active: boolean;
}
