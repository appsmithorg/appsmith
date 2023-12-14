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
   * Create Zone widget.
   */
  const widgetId: string = generateReactKey();
  let updatedWidgets: CanvasWidgetsReduxState = yield call(
    addNewWidgetToDsl,
    allWidgets,
    getCreateWidgetPayload(widgetId, ZoneWidget.type, parentId),
  );

  /**
   * Extract zone layout.
   */
  const zoneProps: FlattenedWidgetProps = updatedWidgets[widgetId];
  const { widgetId: zoneWidgetId } = zoneProps;
  const preset: LayoutProps[] = zoneProps.layout;
  let zoneLayout: LayoutProps = preset[0];

  /**
   * If dragged widget is a new widget,
   * => Create it and add to zone.
   * Else => update parentId of the widget.
   */
  updatedWidgets = yield updateDraggedWidgets(
    updatedWidgets,
    zoneWidgetId,
    draggedWidgets,
  );
  zoneProps.children = updatedWidgets[zoneWidgetId].children;

  /**
   * Split new widgets based on type.
   * This is needed because small and large widgets can't coexist in the same row.
   * So we need to create separate rows for each large widget.
   */
  const [smallWidgets, largeWidgets] = splitWidgets(draggedWidgets);

  /**
   * Add small widgets to the zone layout.
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
   * Add large widgets to the zone layout.
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
   * Update zone preset with the updated zone layout.
   */
  preset[0] = zoneLayout;

  /**
   * Update zone widget with the updated preset.
   */
  zoneProps.layout = preset;

  return {
    canvasWidgets: {
      ...updatedWidgets,
      [zoneWidgetId]: zoneProps,
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

function* updateDraggedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  zoneWidgetId: string,
  draggedWidgets: WidgetLayoutProps[],
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  for (const each of draggedWidgets) {
    const { widgetId, widgetType } = each;
    /**
     * If widget exits.
     * => update parentId.
     */
    if (updatedWidgets[widgetId]) {
      updatedWidgets[widgetId] = {
        ...updatedWidgets[widgetId],
        parentId: zoneWidgetId,
      };
      // Add widget to Zone's children.
      updatedWidgets[zoneWidgetId] = {
        ...updatedWidgets[zoneWidgetId],
        children: [...(updatedWidgets[zoneWidgetId]?.children ?? []), widgetId],
      };
      continue;
    }
    /**
     * Create new widget with zone as the parent.
     */
    updatedWidgets = yield call(
      addNewWidgetToDsl,
      allWidgets,
      getCreateWidgetPayload(widgetId, widgetType, zoneWidgetId),
    );
  }
  return updatedWidgets;
}
