import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import AutoHeightOverlayContainer from "layoutSystems/fixedlayout/common/autoHeightOverlay";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { GridDefaults } from "constants/WidgetConstants";
import React, { useContext } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidgetWithLimits,
} from "widgets/WidgetUtils";

export const AutoHeightOverlayLayer = (props: BaseWidgetProps) => {
  const { batchUpdateWidgetProperty } = useContext(EditorContext);

  if (!isAutoHeightEnabledForWidgetWithLimits(props)) {
    return props.children;
  }

  // required when the limits have to be updated
  // simultaneosuly when they move together
  // to maintain the undo/redo stack
  const onBatchUpdate = ({
    maxHeight,
    minHeight,
  }: {
    maxHeight?: number;
    minHeight?: number;
  }) => {
    const modifyObj: Record<string, unknown> = {};

    if (maxHeight !== undefined) {
      modifyObj["maxDynamicHeight"] = Math.floor(
        maxHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      );
    }

    if (minHeight !== undefined) {
      modifyObj["minDynamicHeight"] = Math.floor(
        minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      );
    }

    batchUpdateWidgetProperty &&
      batchUpdateWidgetProperty(
        props.widgetId,
        {
          modify: modifyObj,
          postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
        },
        true,
      );
    AnalyticsUtil.logEvent("AUTO_HEIGHT_OVERLAY_HANDLES_UPDATE", modifyObj);
  };

  const onMaxHeightSet = (maxHeight: number) => onBatchUpdate({ maxHeight });

  const onMinHeightSet = (minHeight: number) => onBatchUpdate({ minHeight });

  return (
    <>
      <AutoHeightOverlayContainer
        {...props}
        batchUpdate={onBatchUpdate}
        maxDynamicHeight={getWidgetMaxAutoHeight(props)}
        minDynamicHeight={getWidgetMinAutoHeight(props)}
        onMaxHeightSet={onMaxHeightSet}
        onMinHeightSet={onMinHeightSet}
      />
      {props.children}
    </>
  );
};
