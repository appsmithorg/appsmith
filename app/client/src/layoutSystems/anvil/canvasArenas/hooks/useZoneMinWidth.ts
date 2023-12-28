import { useContext } from "react";
import { ChildrenMapContext } from "layoutSystems/anvil/context/childrenMapContext";
import type { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  combinedPreviewModeSelector,
  getRenderMode,
} from "selectors/editorSelectors";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "layoutSystems/anvil/utils/widgetUtils";
import { FLEX_LAYOUT_PADDING } from "layoutSystems/anvil/layoutComponents/components/FlexLayout";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets } from "sagas/selectors";

export function useZoneMinWidth() {
  const childrenMap: Record<string, WidgetProps> =
    useContext(ChildrenMapContext);
  const widgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  const renderMode: RenderModes = useSelector(getRenderMode);
  const isPreviewMode: boolean = useSelector(combinedPreviewModeSelector);

  if (renderMode === RenderModes.CANVAS && !isPreviewMode) return "auto";

  const minWidth: number = Object.keys(childrenMap).reduce(
    (acc: number, curr: string) => {
      const sizeConfig: SizeConfig = getWidgetSizeConfiguration(
        childrenMap[curr].type,
        widgets[curr],
        isPreviewMode,
      );
      if (!sizeConfig.minWidth || !sizeConfig.minWidth["base"]) return acc;

      return Math.max(acc, removeCSSUnits(sizeConfig.minWidth["base"]));
    },
    0,
  );

  return `${minWidth + FLEX_LAYOUT_PADDING * 2}px`;
}

function removeCSSUnits(value: string): number {
  // This regular expression matches the beginning of the string (^)
  // and captures as many numerical characters (including decimal points) as possible
  // The match stops when it encounters a non-numerical character
  const regExp = /^[\d.-]+/;
  const match = value.match(regExp);

  // If a match is found, return it as a number, otherwise return null
  return match ? parseFloat(match[0]) : 0;
}
