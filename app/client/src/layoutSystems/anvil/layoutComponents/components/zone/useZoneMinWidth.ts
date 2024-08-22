import { useContext } from "react";

import type { SizeConfig } from "WidgetProvider/constants";
import { RenderModes } from "constants/WidgetConstants";
import { ChildrenMapContext } from "layoutSystems/anvil/context/childrenMapContext";
import { getWidgetSizeConfiguration } from "layoutSystems/anvil/utils/widgetUtils";
import isObject from "lodash/isObject";
import { useSelector } from "react-redux";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets } from "sagas/selectors";
import {
  combinedPreviewModeSelector,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";

export function useZoneMinWidth() {
  const childrenMap: Record<string, WidgetProps> =
    useContext(ChildrenMapContext);
  const widgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  const renderMode: RenderModes = useSelector(getRenderMode);
  const isPreviewMode: boolean = useSelector(combinedPreviewModeSelector);

  if (renderMode === RenderModes.CANVAS && !isPreviewMode) return "auto";

  let minWidth = 0;

  Object.keys(childrenMap).forEach((child) => {
    const sizeConfig: SizeConfig = getWidgetSizeConfiguration(
      childrenMap[child].type,
      widgets[child],
      isPreviewMode,
    );
    let currentWidth = 0;

    if (sizeConfig.minWidth) {
      if (isObject(sizeConfig.minWidth)) {
        Object.values(sizeConfig.minWidth).forEach((width) => {
          currentWidth = getSizingNumber(width);
        });
      } else {
        currentWidth = getSizingNumber(sizeConfig.minWidth);
      }
    }

    minWidth = currentWidth > minWidth ? currentWidth : minWidth;
  });

  return `sizing-${minWidth}`;
}

function getSizingNumber(value?: string) {
  return value && value.includes("sizing")
    ? Number(value.replace("sizing-", ""))
    : 0;
}
