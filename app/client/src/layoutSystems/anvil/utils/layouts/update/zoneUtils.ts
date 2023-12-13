import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call } from "redux-saga/effects";
import { addWidgetsToChildTemplate } from "./additionUtils";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  addNewWidgetToDsl,
  getCreateWidgetPayload,
} from "../../widgetAdditionUtils";
import { isLargeWidget } from "../../widgetUtils";

export function* createZoneAndAddWidgets(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  parentId: string,
) {
  /**
   * Step 1: Create Zone widget.
   */
  const widgetId: string = generateReactKey();
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    addNewWidgetToDsl,
    allWidgets,
    getCreateWidgetPayload(widgetId, ZoneWidget.type, parentId),
  );

  /**
   * Step 2: Extract zone layout.
   */
  const zoneProps: FlattenedWidgetProps = updatedWidgets[widgetId];

  const preset: LayoutProps[] = zoneProps.layout;
  let zoneLayout: LayoutProps = preset[0];

  /**
   * Step 3: Split new widgets based on type.
   * This is needed because small and large widgets can't coexist in the same row.
   * So we need to create separate rows for each large widget.
   */
  const [smallWidgets, largeWidgets] = splitWidgets(draggedWidgets);

  /**
   * Step 4: Add small widgets to the zone layout.
   */
  const zoneComp: typeof BaseLayoutComponent = LayoutFactory.get(
    zoneLayout.layoutType,
  );

  if (smallWidgets.length) {
    zoneLayout = addWidgetsToChildTemplate(
      zoneLayout,
      zoneComp,
      smallWidgets,
      highlight,
    );
  }

  /**
   * Step 5: Add large widgets to the zone layout.
   */
  largeWidgets.forEach((widget: WidgetLayoutProps) => {
    zoneLayout = addWidgetsToChildTemplate(
      zoneLayout,
      zoneComp,
      [widget],
      highlight,
    );
  });

  /**
   * Step 6: Update zone preset with the updated zone layout.
   */
  preset[0] = zoneLayout;

  /**
   * Step 7: Update canvas widget with the updated preset.
   */
  zoneProps.layout = preset;

  /**
   * Step 8: Add new widgetIds to children of canvas widget.
   */
  zoneProps.children = draggedWidgets.map(
    (widget: WidgetLayoutProps) => widget.widgetId,
  );

  /**
   * Step 9: Revert the relationships that were originally established while creating the dragged widgets.
   */
  draggedWidgets.forEach((widget: WidgetLayoutProps) => {
    updatedWidgets[widget.widgetId] = {
      ...updatedWidgets[widget.widgetId],
      parentId: zoneProps.widgetId,
    };
  });

  return {
    canvasWidgets: {
      ...updatedWidgets,
      [zoneProps.widgetId]: zoneProps,
    },
    zone: zoneProps,
  };
}

function splitWidgets(widgets: WidgetLayoutProps[]): WidgetLayoutProps[][] {
  const smallWidgets: WidgetLayoutProps[] = [];
  const largeWidgets: WidgetLayoutProps[] = [];
  widgets.forEach((widget: WidgetLayoutProps) => {
    if (isLargeWidget(widget.widgetType)) largeWidgets.push(widget);
    else smallWidgets.push(widget);
  });
  return [smallWidgets, largeWidgets];
}
