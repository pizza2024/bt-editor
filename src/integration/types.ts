import type { BTNodeDefinition, BTProject } from '../types/bt';

export type BTEditorMode = 'edit' | 'readonly';
export type BTEditorTheme = 'light' | 'dark' | 'auto';
export type BTEditorEventOrigin = 'user' | 'api' | 'import' | 'system';

export interface FeatureFlags {
  toolbar?: boolean;
  xmlPreview?: boolean;
  debugPanel?: boolean;
  favoritesPanel?: boolean;
  treeTabs?: boolean;
  shortcutsHelp?: boolean;
  pngExport?: boolean;
  importExport?: boolean;
}

export interface UIConfig {
  leftSidebarCollapsed?: boolean;
  rightSidebarCollapsed?: boolean;
  leftSidebarWidth?: number;
  rightSidebarWidth?: number;
  leftTopPaneRatio?: number;
}

export interface BTEditorStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface BTEditorNotifyAdapter {
  alert: (message: string) => void;
  confirm: (message: string) => boolean;
}

export interface BTEditorClipboardAdapter {
  writeText: (text: string) => Promise<void>;
}

export interface BTEditorLoggerAdapter {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export interface EditorAdapters {
  storageAdapter?: BTEditorStorageAdapter;
  notifyAdapter?: BTEditorNotifyAdapter;
  clipboardAdapter?: BTEditorClipboardAdapter;
  loggerAdapter?: BTEditorLoggerAdapter;
}

export interface BTEditorEventContext<TType extends string = string> {
  type: TType;
  origin: BTEditorEventOrigin;
  timestamp: number;
}

export interface BTEditorError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface BTEditorErrorContext extends BTEditorEventContext<'error'> {
  operation?: string;
}

export interface BTEditorSelection {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
}

export interface BTEditorSelectionContext extends BTEditorEventContext<'selection-change'> {}

export interface BTEditorChangeContext extends BTEditorEventContext<'change'> {}

export type BTEditorTreeActionType =
  | 'set-active-tree'
  | 'open-tree-tab'
  | 'close-tree-tab'
  | 'close-other-tree-tabs'
  | 'close-tree-tabs-to-right'
  | 'add-tree'
  | 'rename-tree'
  | 'delete-tree'
  | 'set-main-tree';

export interface BTEditorTreeAction {
  type: BTEditorTreeActionType;
  treeId?: string;
  previousTreeId?: string;
  nextTreeId?: string;
}

export interface BTEditorTreeChangeContext extends BTEditorEventContext<'tree-change'> {
  activeTreeId: string;
  openedTreeIds: string[];
  mainTreeId: string;
}

export type BTEditorCommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BTEditorError };

export interface BTEditorRuntimeState {
  mode: BTEditorMode;
  activeTreeId: string;
  openedTreeIds: string[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  theme: 'light' | 'dark';
}

export interface BTEditorRef {
  getProject: () => BTProject;
  setProject: (project: BTProject) => BTEditorCommandResult<BTProject>;
  importXml: (xml: string) => BTEditorCommandResult<BTProject>;
  exportXml: () => BTEditorCommandResult<string>;
  undo: () => BTEditorCommandResult<BTProject>;
  redo: () => BTEditorCommandResult<BTProject>;
  getState: () => BTEditorRuntimeState;
}

export interface BTEditorModelActions {
  addNodeModel: (definition: BTNodeDefinition, origin?: BTEditorEventOrigin) => void;
  updateNodeModel: (definition: BTNodeDefinition, origin?: BTEditorEventOrigin) => void;
  replaceNodeModel: (type: string, definition: BTNodeDefinition, origin?: BTEditorEventOrigin) => void;
  deleteNodeModel: (type: string, origin?: BTEditorEventOrigin) => void;
}