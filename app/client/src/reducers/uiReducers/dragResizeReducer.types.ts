import type { AnvilHighlightInfo } from "../../layoutSystems/anvil/utils/anvilTypes";

export interface DraggingGroupCenter {
  widgetId?: string;
  widgetType?: string;
  top?: number;
  left?: number;
}

export interface DragDetails {
  dragGroupActualParent?: string;
  draggingGroupCenter?: DraggingGroupCenter;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newWidget?: any;
  draggedOn?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragOffset?: any;
}

export interface WidgetDragResizeState {
  isDragging: boolean;
  dragDetails: DragDetails;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoLayoutDragDetails: any;
  isResizing: boolean;
  anvil: {
    highlightShown?: AnvilHighlightInfo;
    spaceDistribution: {
      isDistributingSpace: boolean;
      widgetsEffected: {
        section: string;
        zones: string[];
      };
    };
  };
  lastSelectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestry: string[];
  entityExplorerAncestry: string[];
  selectedWidgets: string[];
  isAutoCanvasResizing: boolean;
  isDraggingDisabled: boolean;
  blockSelection: boolean;
  altFocus: boolean;
}
