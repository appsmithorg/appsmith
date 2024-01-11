import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { cloneDeep } from "lodash";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import { getDataTree } from "selectors/dataTreeSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import type { CopiedWidgetData } from "./types";
import type { LayoutProps, WidgetLayoutProps } from "../anvilTypes";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import WidgetFactory from "WidgetProvider/factory";
import { widgetHierarchy } from "../constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export function* addPastedWidgets(
  arr: CopiedWidgetData,
  allWidgets: CanvasWidgetsReduxState,
  widgetIdMap: { [key: string]: string },
  reverseWidgetIdMap: { [key: string]: string },
  newParentId: string,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const map: { [key: string]: string } = { ...widgetIdMap };
  const reverseMap: { [key: string]: string } = { ...reverseWidgetIdMap };
  const { list, widgetId } = arr;
  const newList: FlattenedWidgetProps[] = [];

  const evalTree: DataTree = yield select(getDataTree);

  AnalyticsUtil.logEvent("WIDGET_PASTE", {
    widgetName: list[0].widgetName,
    widgetType: list[0].type,
  });

  /**
   * Create new widgets.
   */

  list.forEach((each: FlattenedWidgetProps) => {
    // Clone old widget to create new one.
    const newWidget = cloneDeep(each);
    newWidget.widgetId = generateReactKey();

    // Map old and new widgets
    map[each.widgetId] = newWidget.widgetId;
    reverseMap[newWidget.widgetId] = each.widgetId;

    // Add new widget to the list.
    newList.push(newWidget);

    widgets = { ...widgets, [newWidget.widgetId]: newWidget };
  });

  /**
   * Update properties of new widgets.
   */
  newList.forEach((widget: FlattenedWidgetProps, index: number) => {
    widget.parentId =
      index > 0 && widget.parentId ? map[widget.parentId] : newParentId;
    widget.widgetName = getNextWidgetName(widgets, widget.type, evalTree, {
      prefix: widget.widgetName,
      startWithoutIndex: true,
    });

    if (widget.children?.length) {
      widget.children = widget.children.map((child: string) => {
        return map[child];
      });
    }

    if (widget.layout) {
      widget.layout = [updateLayoutProps(cloneDeep(widget.layout[0]), map)];
    }

    widget = WidgetFactory.performPasteOperationChecks(
      {
        ...widgets,
        [widget.widgetId]: widget,
      },
      map,
      reverseMap,
      widget.widgetId,
      widget.type,
    );

    /**
     * Add widget to all widgets.
     */
    widgets = {
      ...widgets,
      [widget.widgetId]: widget,
    };
  });

  /**
   * Add widgets after original widget and update new parent.
   */
  const parentWidget: FlattenedWidgetProps = widgets[newParentId];
  widgets = {
    ...widgets,
    [newParentId]: {
      ...parentWidget,
      children: [...(parentWidget?.children || []), map[widgetId]],
    },
  };

  return { widgets, map, reverseMap };
}

function updateLayoutProps(
  layout: LayoutProps,
  widgetIdMap: { [key: string]: string },
): LayoutProps {
  // Replace layoutId with a new value
  layout.layoutId = generateReactKey();

  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    // If the layout renders widgets, replace widgetIds with new values
    const widgetLayouts = layout.layout as WidgetLayoutProps[];
    layout.layout = widgetLayouts.map((item: WidgetLayoutProps) => {
      item.widgetId = widgetIdMap[item.widgetId] || item.widgetId;
      return item;
    });
  } else {
    // If the layout renders layouts, parse them recursively
    const layoutProps = layout.layout as LayoutProps[];
    layout.layout = layoutProps.map((item: LayoutProps) => {
      return updateLayoutProps(item, widgetIdMap);
    });
  }

  return layout;
}

export function getContainingLayoutMapping(
  allWidgets: CanvasWidgetsReduxState,
  copiedWidgets: CopiedWidgetData[],
): WidgetLayoutProps[][] {
  let widgetGrouping: WidgetLayoutProps[][] = [];
  const parentMap: { [key: string]: string[] } = {};

  /**
   * Group widgets by similar parents.
   */
  copiedWidgets.forEach((copiedWidget: CopiedWidgetData) => {
    if (parentMap[copiedWidget.parentId]) {
      parentMap[copiedWidget.parentId].push(copiedWidget.widgetId);
    } else {
      parentMap[copiedWidget.parentId] = [copiedWidget.widgetId];
    }
  });

  Object.keys(parentMap).forEach((key: string) => {
    const parent: FlattenedWidgetProps = allWidgets[key];
    if (!parent || !parent.layout) return;

    const containingLayouts: WidgetLayoutProps[][] = extractContainingLayouts(
      parent.layout[0],
      parentMap[key],
    );
    widgetGrouping = [...widgetGrouping, ...containingLayouts];
  });
  return widgetGrouping;
}

function extractContainingLayouts(
  layout: LayoutProps,
  widgetIds: string[],
  res: WidgetLayoutProps[][] = [],
): WidgetLayoutProps[][] {
  if (!widgetIds?.length) return res;
  const arr: WidgetLayoutProps[] = [];
  const indices: number[] = [];
  const widgets: string[] = [...widgetIds];
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    const childWidgets: string[] = (layout.layout as WidgetLayoutProps[]).map(
      (each: WidgetLayoutProps) => each.widgetId,
    );
    widgets.forEach((each: string, index: number) => {
      const childIndex: number = childWidgets.indexOf(each);
      if (childIndex !== -1) {
        arr.push(layout.layout[childIndex] as WidgetLayoutProps);
        indices.push(index);
      }
    });
    if (arr.length) {
      res.push(arr);
    }
  } else {
    (layout.layout as LayoutProps[]).forEach((each: LayoutProps) => {
      extractContainingLayouts(
        each,
        widgets.filter(
          (each: string, index: number) => !indices.includes(index),
        ),
        res,
      );
    });
  }
  return res;
}

export function getParentLayout(
  parent: FlattenedWidgetProps,
): LayoutProps | null {
  if (!parent || !parent.layout) return null;
  // TODO: @Preet - remove this hard coding.
  return parent.layout[0];
}

export function getWidgetHierarchy(type: string, id: string): number {
  if (widgetHierarchy[type]) return widgetHierarchy[type];
  if (id === MAIN_CONTAINER_WIDGET_ID) return widgetHierarchy.MAIN_CANVAS;
  return widgetHierarchy.OTHER;
}

export function splitWidgetsByHierarchy(
  widgets: CopiedWidgetData[],
): CopiedWidgetData[][] {
  const widgetOrders: CopiedWidgetData[][] = [[], [], [], []];
  widgets.forEach((widget: CopiedWidgetData) => {
    widgetOrders[widget.hierarchy].push(widget);
  });
  return widgetOrders;
}
