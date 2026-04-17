export interface EditorWindowEventDetailMap {
  'bt-nodes-updated': undefined;
  'bt-node-edit': {
    nodeId: string;
    portName?: string;
    portDirection?: string;
  };
  'bt-toggle-expand-subtree': {
    nodeId: string;
  };
  'bt-open-subtree': {
    nodeId: string;
  };
  'bt-export-png': undefined;
  'bt-toggle-shortcuts-help': undefined;
}

export type EditorWindowEventName = keyof EditorWindowEventDetailMap;

type EditorWindowEventFor<K extends EditorWindowEventName> =
  EditorWindowEventDetailMap[K] extends undefined
    ? Event
    : CustomEvent<EditorWindowEventDetailMap[K]>;

export function dispatchEditorWindowEvent<K extends EditorWindowEventName>(
  eventName: K,
  detail?: EditorWindowEventDetailMap[K]
): void {
  if (detail === undefined) {
    window.dispatchEvent(new Event(eventName));
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function addEditorWindowEventListener<K extends EditorWindowEventName>(
  eventName: K,
  handler: (event: EditorWindowEventFor<K>) => void
): () => void {
  const listener = handler as unknown as EventListener;
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
