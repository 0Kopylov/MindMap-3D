import React from 'react';
import {
  Brain,
  Lightbulb,
  Code,
  Layers,
  Database,
  Globe,
  Sparkles,
  Cpu,
  Rocket,
  BookOpen,
  FileText,
  Image,
  Video,
  Music,
  Target,
  Atom,
  Workflow,
  Network,
  Server,
  Zap,
  Star,
  Folder,
  CircleDot,
  type LucideProps
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Brain,
  Lightbulb,
  Code,
  Layers,
  Database,
  Globe,
  Sparkles,
  Cpu,
  Rocket,
  BookOpen,
  FileText,
  Image,
  Video,
  Music,
  Target,
  Atom,
  Workflow,
  Network,
  Server,
  Zap,
  Star,
  Folder,
  CircleDot,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function renderNodeIcon(iconName: string, props: LucideProps = {}) {
  const IconComponent = ICON_MAP[iconName] || CircleDot;
  return <IconComponent {...props} />;
}
