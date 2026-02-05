import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types for configuration data
export interface ConfigNode {
  path: string[];
  name: string;
  value: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  children?: ConfigNode[];
  description?: string;
  isRequired?: boolean;
  defaultValue?: string | number | boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface ConfigSection {
  id: string;
  name: string;
  path: string[];
  description?: string;
  nodes: ConfigNode[];
}

export interface ConfigHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  version: string;
  description: string;
  changes: ConfigChange[];
  isCurrent: boolean;
  node?: string;
}

export interface ConfigChange {
  path: string;
  action: 'added' | 'removed' | 'modified';
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

export interface ConfigDiff {
  versionFrom: string;
  versionTo: string;
  changes: ConfigChange[];
}

export interface ConfigApplyResult {
  success: boolean;
  version: string;
  timestamp: string;
  errors?: string[];
  warnings?: string[];
}

export interface ConfigValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ConfigState {
  // Current configuration
  config: ConfigNode[];
  configSections: ConfigSection[];
  activeSection: string | null;

  // Configuration history
  history: ConfigHistoryEntry[];
  currentVersion: string | null;
  selectedHistoryEntry: ConfigHistoryEntry | null;

  // Editing state
  unsavedChanges: boolean;
  editingNode: ConfigNode | null;
  validationErrors: ConfigValidationError[];

  // Loading states
  isLoadingConfig: boolean;
  isLoadingHistory: boolean;
  isApplyingConfig: boolean;
  isRollingBack: boolean;

  // Errors
  error: string | null;
  applyError: string | null;

  // Actions - Config
  setConfig: (config: ConfigNode[]) => void;
  setConfigSections: (sections: ConfigSection[]) => void;
  setActiveSection: (section: string | null) => void;
  updateNode: (path: string[], value: string | number | boolean | null) => void;
  addNode: (parentPath: string[], node: ConfigNode) => void;
  removeNode: (path: string[]) => void;
  setEditingNode: (node: ConfigNode | null) => void;

  // Actions - History
  setHistory: (history: ConfigHistoryEntry[]) => void;
  setSelectedHistoryEntry: (entry: ConfigHistoryEntry | null) => void;
  setCurrentVersion: (version: string) => void;

  // Actions - Changes
  setUnsavedChanges: (hasChanges: boolean) => void;
  resetUnsavedChanges: () => void;
  setValidationErrors: (errors: ConfigValidationError[]) => void;

  // Actions - Loading
  setLoadingConfig: (loading: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setApplyingConfig: (applying: boolean) => void;
  setRollingBack: (rollingBack: boolean) => void;

  // Actions - Errors
  setError: (error: string | null) => void;
  setApplyError: (error: string | null) => void;

  // Actions - Helpers
  findNodeByPath: (path: string[]) => ConfigNode | null;
  validateConfig: () => ConfigValidationError[];
  hasChangesAt: (path: string[]) => boolean;

  // Reset
  reset: () => void;
}

const initialState = {
  config: [],
  configSections: [],
  activeSection: null,
  history: [],
  currentVersion: null,
  selectedHistoryEntry: null,
  unsavedChanges: false,
  editingNode: null,
  validationErrors: [],
  isLoadingConfig: false,
  isLoadingHistory: false,
  isApplyingConfig: false,
  isRollingBack: false,
  error: null,
  applyError: null,
};

// Helper function to find a node by path in the config tree
const findNodeByPath = (nodes: ConfigNode[], path: string[]): ConfigNode | null => {
  if (path.length === 0) {
    return null;
  }

  const [currentName, ...remainingPath] = path;

  for (const node of nodes) {
    if (node.name === currentName) {
      if (remainingPath.length === 0) {
        return node;
      }
      if (node.children) {
        return findNodeByPath(node.children, remainingPath);
      }
    }
  }

  return null;
};

// Helper function to update a node by path
const updateNodeByPath = (
  nodes: ConfigNode[],
  path: string[],
  value: string | number | boolean | null
): ConfigNode[] => {
  if (path.length === 0) {
    return nodes;
  }

  const [currentName, ...remainingPath] = path;

  return nodes.map((node) => {
    if (node.name === currentName) {
      if (remainingPath.length === 0) {
        return { ...node, value };
      }
      return {
        ...node,
        children: node.children ? updateNodeByPath(node.children, remainingPath, value) : [],
      };
    }
    return node;
  });
};

// Helper function to add a node
const addNodeAtPath = (
  nodes: ConfigNode[],
  parentPath: string[],
  newNode: ConfigNode
): ConfigNode[] => {
  if (parentPath.length === 0) {
    return [...nodes, newNode];
  }

  const [currentName, ...remainingPath] = parentPath;

  return nodes.map((node) => {
    if (node.name === currentName) {
      if (remainingPath.length === 0) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      return {
        ...node,
        children: node.children ? addNodeAtPath(node.children, remainingPath, newNode) : [newNode],
      };
    }
    return node;
  });
};

// Helper function to remove a node by path
const removeNodeByPath = (nodes: ConfigNode[], path: string[]): ConfigNode[] => {
  if (path.length === 0) {
    return nodes;
  }

  const [currentName, ...remainingPath] = path;

  return nodes
    .filter((node) => node.name !== currentName || remainingPath.length > 0)
    .map((node) => {
      if (node.name === currentName && remainingPath.length > 0 && node.children) {
        return {
          ...node,
          children: removeNodeByPath(node.children, remainingPath),
        };
      }
      return node;
    });
};

// Helper function to validate a config tree
const validateTree = (nodes: ConfigNode[], parentPath: string[] = []): ConfigValidationError[] => {
  const errors: ConfigValidationError[] = [];

  for (const node of nodes) {
    const currentPath = [...parentPath, node.name];

    // Check required fields
    if (node.isRequired && (node.value === null || node.value === '')) {
      errors.push({
        path: currentPath.join('.'),
        message: `${node.name} is required`,
        severity: 'error',
      });
    }

    // Check type-specific validations
    if (node.validation && node.value !== null) {
      const { pattern, min, max, options } = node.validation;

      if (pattern && typeof node.value === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(node.value)) {
          errors.push({
            path: currentPath.join('.'),
            message: `${node.name} does not match required pattern`,
            severity: 'error',
          });
        }
      }

      if (min !== undefined && typeof node.value === 'number' && node.value < min) {
        errors.push({
          path: currentPath.join('.'),
          message: `${node.name} must be at least ${min}`,
          severity: 'error',
        });
      }

      if (max !== undefined && typeof node.value === 'number' && node.value > max) {
        errors.push({
          path: currentPath.join('.'),
          message: `${node.name} must be at most ${max}`,
          severity: 'error',
        });
      }

      if (options && typeof node.value === 'string' && !options.includes(node.value)) {
        errors.push({
          path: currentPath.join('.'),
          message: `${node.name} must be one of: ${options.join(', ')}`,
          severity: 'error',
        });
      }
    }

    // Recursively validate children
    if (node.children) {
      errors.push(...validateTree(node.children, currentPath));
    }
  }

  return errors;
};

export const useConfigStore = create<ConfigState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setConfig: (config) => set({ config }),

    setConfigSections: (configSections) => set({ configSections }),

    setActiveSection: (activeSection) => set({ activeSection }),

    updateNode: (path, value) => {
      set((state) => ({
        config: updateNodeByPath(state.config, path, value),
        unsavedChanges: true,
      }));
      // Re-validate after update
      get().validateConfig();
    },

    addNode: (parentPath, node) => {
      set((state) => ({
        config: addNodeAtPath(state.config, parentPath, node),
        unsavedChanges: true,
      }));
    },

    removeNode: (path) => {
      set((state) => ({
        config: removeNodeByPath(state.config, path),
        unsavedChanges: true,
      }));
    },

    setEditingNode: (editingNode) => set({ editingNode }),

    setHistory: (history) => set({ history }),

    setSelectedHistoryEntry: (selectedHistoryEntry) => set({ selectedHistoryEntry }),

    setCurrentVersion: (currentVersion) => set({ currentVersion }),

    setUnsavedChanges: (unsavedChanges) => set({ unsavedChanges }),

    resetUnsavedChanges: () => set({ unsavedChanges: false, validationErrors: [] }),

    setValidationErrors: (validationErrors) => set({ validationErrors }),

    setLoadingConfig: (isLoadingConfig) => set({ isLoadingConfig }),

    setLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),

    setApplyingConfig: (isApplyingConfig) => set({ isApplyingConfig }),

    setRollingBack: (isRollingBack) => set({ isRollingBack }),

    setError: (error) => set({ error }),

    setApplyError: (applyError) => set({ applyError }),

    findNodeByPath: (path) => {
      return findNodeByPath(get().config, path);
    },

    validateConfig: () => {
      const errors = validateTree(get().config);
      set({ validationErrors: errors });
      return errors;
    },

    hasChangesAt: (path) => {
      // This would need to be implemented to track changes per path
      // For now, just return true if there are unsaved changes
      return get().unsavedChanges;
    },

    reset: () => set(initialState),
  }))
);

// Selectors
export const selectConfigByPath = (path: string[]) => (state: ConfigState) => {
  return findNodeByPath(state.config, path);
};

export const selectSectionByPath = (path: string[]) => (state: ConfigState) => {
  return state.configSections.find((section) =>
    path.every((part, index) => section.path[index] === part)
  );
};

export const selectActiveSection = (state: ConfigState) => {
  return state.configSections.find((section) => section.id === state.activeSection);
};