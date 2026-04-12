const en = {
  // Toolbar
  toolbar: {
    sample: 'Sample',
    delete: 'Delete',
    undo: 'Undo',
    redo: 'Redo',
    exportXml: 'Export XML',
    importXml: 'Import XML',
    exportPng: 'Export PNG',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    help: 'Help',
  },
  // Context menu
  contextMenu: {
    addChild: 'Add Child Node',
    edit: 'Edit',
    delete: 'Delete',
    duplicate: 'Duplicate',
    copy: 'Copy',
    paste: 'Paste',
    convertToSubtree: 'Convert to Subtree',
  },
  // Properties panel
  properties: {
    name: 'Name',
    ports: 'Ports',
    parameters: 'Parameters',
    preconditions: 'Pre-conditions',
    postconditions: 'Post-conditions',
    apply: 'Apply',
    cancel: 'Cancel',
    nodeType: 'Node Type',
    category: 'Category',
    description: 'Description',
    required: 'Required',
    optional: 'Optional',
  },
  // Node edit modal
  nodeEdit: {
    editNode: 'Edit Node',
    createNode: 'Create Node',
    nodeName: 'Node Name',
    selectModel: 'Select Model',
    portSettings: 'Port Settings',
    inputPorts: 'Input Ports',
    outputPorts: 'Output Ports',
    addPort: 'Add Port',
    removePort: 'Remove Port',
    portName: 'Port Name',
    portType: 'Port Type',
    save: 'Save',
    close: 'Close',
  },
  // Precondition/Postcondition keys
  conditions: {
    failureIf: '_failureIf',
    successIf: '_successIf',
    skipIf: '_skipIf',
    while: '_while',
    onSuccess: '_onSuccess',
    onFailure: '_onFailure',
    onHalted: '_onHalted',
    post: '_post',
  },
  // Toast messages
  toast: {
    exportSuccess: 'Tree exported successfully',
    importSuccess: 'Tree imported successfully',
    copySuccess: 'Node copied to clipboard',
    pasteSuccess: 'Node pasted from clipboard',
    deleteSuccess: 'Node deleted',
    undoSuccess: 'Undone',
    redoSuccess: 'Redone',
    saveSuccess: 'Saved successfully',
    error: 'An error occurred',
  },
  // Help
  help: {
    title: 'Keyboard Shortcuts',
    categories: {
      general: 'General',
      selection: 'Selection',
      editing: 'Editing',
      navigation: 'Navigation',
    },
    shortcuts: {
      showHelp: 'Show keyboard shortcuts',
      exportXml: 'Export tree as XML',
      undo: 'Undo',
      redo: 'Redo',
      selectAll: 'Select all nodes',
      copy: 'Copy selected nodes',
      paste: 'Paste nodes',
      delete: 'Delete selected nodes',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      resetZoom: 'Reset zoom',
      fitView: 'Fit to view',
      selectAllNodes: 'Select all nodes',
      deselect: 'Deselect all',
      nudgeUp: 'Move up',
      nudgeDown: 'Move down',
      nudgeLeft: 'Move left',
      nudgeRight: 'Move right',
    },
  },
  // Canvas
  canvas: {
    dragHint: 'Drag nodes from palette → canvas · Connect nodes · Double-click to rename',
    treeLabel: 'Tree',
    mainTree: 'MainTree',
  },
  // Node palette
  palette: {
    searchPlaceholder: 'Search models...',
    categories: {
      actions: 'Actions',
      conditions: 'Conditions',
      decorators: 'Decorators',
      trees: 'Trees',
    },
  },
  // Validation messages
  validation: {
    requiredPort: 'Required port missing',
    invalidBlackboardKey: 'Invalid blackboard key',
    portTypeMismatch: 'Port type mismatch',
  },
  // Language
  language: {
    switch: 'Language',
    en: 'English',
    zh: '中文',
  },
};

export default en;
