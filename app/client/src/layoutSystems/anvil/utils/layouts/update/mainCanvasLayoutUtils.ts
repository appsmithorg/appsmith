import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { getAffectedLayout } from "./additionUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import { createSectionAndAddWidget } from "./sectionUtils";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { call } from "redux-saga/effects";

export function* addWidgetsToMainCanvasLayout(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
) {
  let canvasWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  /**
   * Step 1: Get layout for MainCanvas.
   */
  let mainCanvasWidget: WidgetProps = allWidgets[highlight.canvasId];
  let mainCanvasPreset: LayoutProps[] = mainCanvasWidget.layout;
  let mainCanvasLayout: LayoutProps | undefined = getAffectedLayout(
    mainCanvasPreset,
    highlight.layoutOrder,
  );

  if (!mainCanvasLayout) return allWidgets;

  /**
   * Step 2: Create a new Section Widget and add the dragged widgets to it.
   */
  const res: { canvasWidgets: CanvasWidgetsReduxState; section: WidgetProps } =
    yield call(
      createSectionAndAddWidget,
      canvasWidgets,
      highlight,
      draggedWidgets,
      highlight.canvasId,
    );
  canvasWidgets = res.canvasWidgets;

  /**
   * Step 3: Add the new Section Widget to the MainCanvasLayout.
   */
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
    mainCanvasLayout.layoutType,
  );

  mainCanvasLayout = Comp.addChild(
    mainCanvasLayout,
    [
      {
        alignment: highlight.alignment,
        widgetId: res.section.widgetId,
        widgetType: res.section.type,
      },
    ],
    highlight,
  );

  /**
   * Step 4: Update the MainCanvasLayout preset with the updated layout.
   */
  mainCanvasPreset = [mainCanvasLayout];

  /**
   * Step 5: Update the MainCanvasWidget with the updated preset.
   * Also add the new section widget to its children.
   */

  mainCanvasWidget = {
    ...mainCanvasWidget,
    children: [...mainCanvasWidget.children, res.section.widgetId],
    layout: mainCanvasPreset,
  };

  return {
    ...canvasWidgets,
    [mainCanvasWidget.widgetId]: mainCanvasWidget,
  };
}
