import type { AppState } from "@appsmith/reducers";
import type { LayoutProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { createSelector } from "reselect";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { SizeConfig } from "WidgetProvider/constants";
import { getWidgetSizeConfiguration } from "../utils/widgetUtils";
import {
  combinedPreviewModeSelector,
  getRenderMode,
} from "selectors/editorSelectors";
import { RenderModes } from "constants/WidgetConstants";
import { FLEX_LAYOUT_PADDING } from "../layoutComponents/components/FlexLayout";

// ToDo: This is a placeholder implementation this is bound to change
export function getDropTargetLayoutId(state: AppState, canvasId: string) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;
  return layout[0].layoutId;
}

export const getZoneMinWidth = (childrenMap: { [key: string]: WidgetProps }) =>
  createSelector(
    getCanvasWidgets,
    getRenderMode,
    combinedPreviewModeSelector,
    (
      widgets: CanvasWidgetsReduxState,
      renderMode: RenderModes,
      isPreviewMode: boolean,
    ): string => {
      if (renderMode === RenderModes.CANVAS && !isPreviewMode) return "auto";
      const childWidgets: {
        [key: string]: WidgetProps;
      } = {};
      Object.keys(childrenMap).forEach((childId: string) => {
        childWidgets[childId] = widgets[childId];
      });
      const minWidth: number = Object.keys(childWidgets).reduce(
        (acc: number, curr: string) => {
          const sizeConfig: SizeConfig = getWidgetSizeConfiguration(
            childWidgets[curr].type,
            childWidgets[curr],
          );
          if (!sizeConfig.minWidth || !sizeConfig.minWidth["base"]) return acc;

          return Math.max(acc, removeCSSUnits(sizeConfig.minWidth["base"]));
        },
        0,
      );
      return `${minWidth + FLEX_LAYOUT_PADDING * 2}px`;
    },
  );

function removeCSSUnits(value: string): number {
  // This regular expression matches the beginning of the string (^)
  // and captures as many numerical characters (including decimal points) as possible
  // The match stops when it encounters a non-numerical character
  const regExp = /^[\d.-]+/;
  const match = value.match(regExp);

  // If a match is found, return it as a number, otherwise return null
  return match ? parseFloat(match[0]) : 0;
}

// function splitCSSValue(value: string): { value: number; unit: string } | null {
//   // This regular expression matches the numerical part and the unit part separately
//   const regExp = /^([\d.-]+)([a-zA-Z%]*)$/;
//   const match = value.match(regExp);

//   if (match) {
//     return {
//       value: parseFloat(match[1]), // The numerical part
//       unit: match[2], // The unit part
//     };
//   } else {
//     return null;
//   }
// }
