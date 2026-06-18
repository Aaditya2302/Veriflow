const STORAGE_KEY = 'veriflow_workflow_state';

/**
 * Persist current workflow state to localStorage.
 * Only persists serializable data — file blobs are NOT stored.
 */
export function saveWorkflowState(state) {
  try {
    const persistable = {
      uploadStage: state.uploadStage,
      confirmedMapping: state.confirmedMapping || null,
      previousMapping: state.previousMapping || null,
      useSavedMapping: state.useSavedMapping || false,
      detectionResult: state.detectionResult || null,
      validationResults: state.validationResults || null,
      fileMetadata: state.file
        ? { name: state.file.name, size: state.file.size, lastModified: state.file.lastModified }
        : state.fileMetadata || null,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (err) {
    console.warn('[Veriflow] Failed to save workflow state:', err);
  }
}

/**
 * Restore persisted workflow state from localStorage.
 * Returns null if nothing is stored or data is corrupted.
 */
export function restoreWorkflowState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Only restore actionable stages — skip transient ones
    const restorableStages = ['mapping', 'results'];
    if (!restorableStages.includes(parsed.uploadStage)) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[Veriflow] Failed to restore workflow state:', err);
    return null;
  }
}

/**
 * Clear all persisted workflow state from localStorage.
 * Called when user starts a new validation.
 */
export function clearWorkflowState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Veriflow] Failed to clear workflow state:', err);
  }
}
