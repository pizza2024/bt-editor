import { createContext, useContext } from 'react';
import type {
  BTEditorCommandResult,
  BTEditorError,
  BTEditorEventOrigin,
  BTEditorModelActions,
  BTEditorMode,
  BTEditorTheme,
  FeatureFlags,
  UIConfig,
} from './types';
import type { BTProject } from '../types/bt';
import type { ResolvedEditorAdapters } from './defaultAdapters';

export interface BTEditorIntegrationContextValue {
  mode: BTEditorMode;
  readonly: boolean;
  theme?: BTEditorTheme;
  locale?: string;
  features: Required<FeatureFlags>;
  uiConfig: UIConfig;
  adapters: ResolvedEditorAdapters;
  localeControlled: boolean;
  themeControlled: boolean;
  modelActions: BTEditorModelActions;
  guardEditableAction: (operation: string) => boolean;
  importXml: (xml: string, origin?: BTEditorEventOrigin) => BTEditorCommandResult<BTProject>;
  exportXml: (origin?: BTEditorEventOrigin) => BTEditorCommandResult<string>;
  reportError: (error: BTEditorError, origin?: BTEditorEventOrigin, operation?: string) => void;
}

const BTEditorIntegrationContext = createContext<BTEditorIntegrationContextValue | null>(null);

export const BTEditorIntegrationProvider = BTEditorIntegrationContext.Provider;

export function useBTEditorIntegration() {
  return useContext(BTEditorIntegrationContext);
}

export function isIntegrationReadonly(integration: BTEditorIntegrationContextValue | null | undefined) {
  return (integration?.readonly ?? false) || integration?.mode === 'readonly';
}

export function useEditorReadonly() {
  return isIntegrationReadonly(useBTEditorIntegration());
}