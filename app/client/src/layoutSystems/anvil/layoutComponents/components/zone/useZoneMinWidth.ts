import { useContext } from "react";
import { ChildrenMapContext } from "layoutSystems/anvil/context/childrenMapContext";
import type { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "layoutSystems/anvil/utils/widgetUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets } from "sagas/selectors";
import isObject from "lodash/isObject";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

export function useZoneMinWidth() {
  const childrenMap: Record<string, WidgetProps> =
    useContext(ChildrenMapContext);
  const widgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  const renderMode: RenderModes = useSelector(getRenderMode);
  const isPreviewMode: boolean = useSelector(selectCombinedPreviewMode);

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
