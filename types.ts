// This file will contain shared TypeScript type definitions.

export type Screen = 'dashboard' | 'editor' | 'sketch' | 'visualizer' | 'settings';
export type Theme = 'dark' | 'light';
export type Note = {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
};
export type TreeNode = {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
};

// Types for Sketchpad
export type Point = {
    x: number;
    y: number;
};
export type Stroke = {
    color: string;
    size: number;
    points: Point[];
};
export type Tool = {
    color: string;
    size: number;
};