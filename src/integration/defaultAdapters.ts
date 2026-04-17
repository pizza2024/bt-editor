import type {
  BTEditorClipboardAdapter,
  BTEditorLoggerAdapter,
  BTEditorNotifyAdapter,
  BTEditorStorageAdapter,
  EditorAdapters,
} from './types';

export const PROJECT_STORAGE_KEY = 'bt-tree-editor';
export const THEME_STORAGE_KEY = 'bt-theme';
export const LOCALE_STORAGE_KEY = 'bt-language';

const noopStorageAdapter: BTEditorStorageAdapter = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const defaultBrowserStorageAdapter: BTEditorStorageAdapter = {
  getItem(key) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return noopStorageAdapter.getItem(key);
    }

    return window.localStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) {
      noopStorageAdapter.setItem(key, value);
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    if (typeof window === 'undefined' || !window.localStorage) {
      noopStorageAdapter.removeItem(key);
      return;
    }

    window.localStorage.removeItem(key);
  },
};

export const defaultBrowserNotifyAdapter: BTEditorNotifyAdapter = {
  alert(message) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    }
  },
  confirm(message) {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(message);
    }

    return false;
  },
};

export const defaultBrowserClipboardAdapter: BTEditorClipboardAdapter = {
  async writeText(text) {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('Clipboard API unavailable');
    }

    await navigator.clipboard.writeText(text);
  },
};

export const defaultBrowserLoggerAdapter: BTEditorLoggerAdapter = {
  info(message, ...args) {
    console.info(message, ...args);
  },
  warn(message, ...args) {
    console.warn(message, ...args);
  },
  error(message, ...args) {
    console.error(message, ...args);
  },
};

export interface ResolvedEditorAdapters {
  storageAdapter: BTEditorStorageAdapter;
  notifyAdapter: BTEditorNotifyAdapter;
  clipboardAdapter: BTEditorClipboardAdapter;
  loggerAdapter: BTEditorLoggerAdapter;
}

export function resolveEditorAdapters(adapters?: EditorAdapters): ResolvedEditorAdapters {
  return {
    storageAdapter: adapters?.storageAdapter ?? defaultBrowserStorageAdapter,
    notifyAdapter: adapters?.notifyAdapter ?? defaultBrowserNotifyAdapter,
    clipboardAdapter: adapters?.clipboardAdapter ?? defaultBrowserClipboardAdapter,
    loggerAdapter: adapters?.loggerAdapter ?? defaultBrowserLoggerAdapter,
  };
}

export function readStoredLocale(storageAdapter: BTEditorStorageAdapter = defaultBrowserStorageAdapter) {
  return storageAdapter.getItem(LOCALE_STORAGE_KEY) || 'en';
}

export function writeStoredLocale(
  locale: string,
  storageAdapter: BTEditorStorageAdapter = defaultBrowserStorageAdapter
) {
  storageAdapter.setItem(LOCALE_STORAGE_KEY, locale);
}

export function readStoredTheme(
  storageAdapter: BTEditorStorageAdapter = defaultBrowserStorageAdapter
): 'light' | 'dark' {
  const stored = storageAdapter.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function writeStoredTheme(
  theme: 'light' | 'dark',
  storageAdapter: BTEditorStorageAdapter = defaultBrowserStorageAdapter
) {
  storageAdapter.setItem(THEME_STORAGE_KEY, theme);
}