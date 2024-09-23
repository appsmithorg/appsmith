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
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { isLargeWidget } from "../../widgetUtils";
import { anvilWidgets } from "widgets/wds/constants";
import {
  moveWidgets,
  severTiesFromParents,
  transformMovedWidgets,
} from "./moveUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  hasWidgetJsPropertiesEnabled,
  isEmptyWidget,
  widgetChildren,
} from "../widgetUtils";
import { addNewAnvilWidgetToDSL } from "layoutSystems/anvil/integrations/sagas/anvilWidgetAdditionSagas/helpers";

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
  const updatedWidgets: CanvasWidgetsReduxState = yield addNewAnvilWidgetToDSL(
    allWidgets,
    {
      widgetId,
      type: anvilWidgets.ZONE_WIDGET,
      parentId,
    },
  );

  /**
   * Extract zone layout.
   */
  const zoneProps: FlattenedWidgetProps = updatedWidgets[widgetId];

  /**
   * Add widgets to zone. and update relationships.
   */
  const res: { canvasWidgets: CanvasWidgetsReduxState; zone: WidgetProps } =
    yield call(
      addWidgetsToZone,
      updatedWidgets,
      draggedWidgets,
      highlight,
      zoneProps,
    );

  return res;
}

export function* addWidgetsToZone(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  zone: WidgetProps,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const zoneProps = { ...zone };
  const preset: LayoutProps[] = zoneProps.layout;
  let zoneLayout: LayoutProps = preset[0];
  const { widgetId: zoneWidgetId } = zoneProps;

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

  let rowsAdded = 0;

  if (smallWidgets.length) {
    zoneLayout = addWidgetsToChildTemplate(
      zoneLayout,
      zoneComp,
      smallWidgets,
      highlight,
    );
    rowsAdded += 1;
  }

  /**
   * Add large widgets to the zone layout.
   */
  largeWidgets.forEach((widget: WidgetLayoutProps, index: number) => {
    zoneLayout = addWidgetsToChildTemplate(zoneLayout, zoneComp, [widget], {
      ...highlight,
      rowIndex: highlight.rowIndex + rowsAdded + index,
    });
  });

  /**
   * Update zone widget with the updated preset.
   */
  zoneProps.layout = [zoneLayout];

  return {
    canvasWidgets: {
      ...updatedWidgets,
      [zoneProps.widgetId]: zoneProps,
    },
    zone: zoneProps,
  };
}

export function splitWidgets(
  widgets: WidgetLayoutProps[],
): WidgetLayoutProps[][] {
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
    updatedWidgets = yield addNewAnvilWidgetToDSL(allWidgets, {
      widgetId,
      type: widgetType,
      parentId: zoneWidgetId,
    });
  }

  return updatedWidgets;
}

function* moveWidgetsToNewLayout(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Remove moved widgets from previous parents.
   */
  widgets = severTiesFromParents(widgets, movedWidgets);

  /**
   * Get the new Zone parent and its Canvas.
   */
  const { canvasId } = highlight;

  const zone: FlattenedWidgetProps = widgets[canvasId];

  /**
   * Add moved widgets to the section.
   */
  const { canvasWidgets } = yield call(
    addWidgetsToZone,
    widgets,
    transformMovedWidgets(widgets, movedWidgets, highlight),
    highlight,
    zone,
  );

  return canvasWidgets;
}

export function* moveWidgetsToZone(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  const widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const draggedWidgets: WidgetLayoutProps[] = transformMovedWidgets(
    widgets,
    movedWidgets,
    highlight,
  );
  const isLargeWidgetPresent = draggedWidgets.some((each) =>
    isLargeWidget(each.widgetType),
  );

  if (isLargeWidgetPresent) {
    // If a large widget is present, move widgets to a new layout.
    const canvasWidgets: CanvasWidgetsReduxState = yield call(
      moveWidgetsToNewLayout,
      widgets,
      movedWidgets,
      highlight,
    );

    return canvasWidgets;
  } else {
    // If no large widget is present, move widgets to the same layout.
    const updatedWidgets = moveWidgets(allWidgets, movedWidgets, highlight);

    return updatedWidgets;
  }
}

export const isZoneWidget = (widget: FlattenedWidgetProps): boolean =>
  widget.type === anvilWidgets.ZONE_WIDGET;

export const isRedundantZoneWidget = (
  widget: FlattenedWidgetProps,
  parentSection: FlattenedWidgetProps,
): boolean =>
  isZoneWidget(widget) &&
  isEmptyWidget(widget) &&
  // Check that the zone is the only child of the parent section.
  widgetChildren(parentSection).length === 1 &&
  !hasWidgetJsPropertiesEnabled(widget);
