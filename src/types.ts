export interface Character {
  id: string;
  name: string;
  role: string; // Nam chính, Nữ chính, Đồng hành, Phản diện, Phụ
  age: string;
  appearance: string;
  personality: string;
  goals: string;
  strengths: string;
  weaknesses: string;
  items: string[];
  skills: string[];
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export interface OutlineNode {
  id: string;
  title: string;
  description: string;
  expandedScenes: string[];
  completed?: boolean;
}

export interface TimelineEvent {
  id: string;
  day: string;
  event: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  summary?: string;
  auditReport?: {
    score: number;
    hasLogicErrors?: boolean;
    logicIssues?: string[];
    autoFixed?: boolean;
    correctedContent?: string;
  };
  wordCount: number;
  createdAt: string;
}

export interface StyleProfile {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  perspective: string;
  pacing: string;
  sentenceStructure: string;
  vocabularyStyle: string;
  dialogueStyle: string;
  sensoryDetailing: string;
  summaryGuideline: string;
  isPreset?: boolean;
  createdAt?: string;
}

export interface WorldRules {
  setting: string;
  magicOrTech: string;
  historyAndFactions: string;
}

export interface PlotRevision {
  id: string;
  createdAt: string;
  versionName: string;
  pitch: string;
  targetTone: string;
  adaptationNotes?: string;
  chaptersCount: number;
}

export type StoryLength = 'Ngắn' | 'Trung bình' | 'Dài' | 'Siêu dài';

export interface Story {
  id: string;
  title: string;
  author: string;
  pitch: string;
  genres: string[];
  targetTone: string;
  lengthOption: StoryLength;
  worldRules: WorldRules;
  characters: Character[];
  relationships: Relationship[];
  outlineNodes: OutlineNode[];
  timeline: TimelineEvent[];
  chapters: Chapter[];
  styleProfile?: StyleProfile;
  savedStyleProfiles?: StyleProfile[];
  plotRevisions?: PlotRevision[];
  status?: 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}
