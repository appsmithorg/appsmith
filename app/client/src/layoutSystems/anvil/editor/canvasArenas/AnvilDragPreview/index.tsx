import React from "react";
import { createPortal } from "react-dom";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";
import { AnvilDragPreviewComponent } from "./AnvilDragPreviewComponent";
import WidgetFactory from "WidgetProvider/factory";
import memoize from "micro-memoize";

interface DragPreviewConfig {
  displayName: string;
  ThumbnailCmp?: () => JSX.Element;
}

const getWidgetConfigsArray = memoize(() => {
  const widgetConfigs = WidgetFactory.getConfigs();

  return Object.values(widgetConfigs);
});

const getWidgetDragPreviewProps = (
  widgetType: string,
): DragPreviewConfig | undefined => {
  const widgetConfigsArray = getWidgetConfigsArray();
  const widgetConfig = widgetConfigsArray.find(
    (config) => config.type === widgetType,
  );
  const { ThumbnailCmp } = WidgetFactory.getWidgetMethods(widgetType);

  if (widgetConfig && ThumbnailCmp && widgetConfig.displayName) {
    return {
      displayName: widgetConfig.displayName,
      ThumbnailCmp,
    };
  }

  return undefined;
};

export const AnvilDragPreview = ({
  dragDetails,
  draggedBlocks,
  isDragging,
  isNewWidget,
}: {
  dragDetails: DragDetails;
  draggedBlocks: DraggedWidget[];
  isDragging: boolean;
  isNewWidget: boolean;
}) => {
  const widgetType = isNewWidget
    ? dragDetails?.newWidget?.type
    : dragDetails?.draggingGroupCenter?.widgetType || "";
  const dragPreviewProps = getWidgetDragPreviewProps(widgetType);
  const showDragPreview = isDragging && !!dragPreviewProps;
  const draggedWidgetCount = draggedBlocks.length;

  return showDragPreview
    ? createPortal(
        <AnvilDragPreviewComponent
          {...dragPreviewProps}
          draggedWidgetCount={draggedWidgetCount}
          isDragging={isDragging}
        />,
        document.body,
      )
    : null;
};
