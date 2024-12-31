import type { AppState } from "ee/reducers";
import type { CSSProperties } from "react";
import React, { memo } from "react";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import AutoHeightOverlayWithStateContext from "./AutoHeightOverlayWithStateContext";

export interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

export interface AutoHeightOverlayContainerProps
  extends MinMaxHeightProps,
    WidgetProps {
  batchUpdate: (options: { minHeight?: number; maxHeight?: number }) => void;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  style?: CSSProperties;
}

const AutoHeightOverlayContainer: React.FC<AutoHeightOverlayContainerProps> =
  memo((props) => {
    const widgetId = props.widgetId;
    const {
      isDragging,
      isResizing,
      lastSelectedWidget: selectedWidget,
      selectedWidgets,
    } = useSelector((state: AppState) => state.ui.widgetDragResize);

    const isPreviewMode = useSelector(combinedPreviewModeSelector);
    const isAppSettingsPaneWithNavigationTabOpen = useSelector(
      getIsAppSettingsPaneWithNavigationTabOpen,
    );

    const isWidgetSelected = selectedWidget === widgetId;
    const multipleWidgetsSelected = selectedWidgets.length > 1;
    const isHidden = multipleWidgetsSelected || isDragging || isResizing;

    if (
      isWidgetSelected &&
      (!isPreviewMode || !isAppSettingsPaneWithNavigationTabOpen)
    ) {
      return (
        <AutoHeightOverlayWithStateContext isHidden={isHidden} {...props} />
      );
    }

    return null;
  });

export default AutoHeightOverlayContainer;
