export interface CanvasSelectionState {
  selectedWidgets: string[];
  focusedWidget?: string;
  lastSelectedWidget?: string;
  isDragging: boolean;
  isResizing: boolean;
}
