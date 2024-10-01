import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { deleteWidgetFromPreset } from "./deletionUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import { addWidgetsToPreset } from "./additionUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";

/**
 * Update widgets relationship upon movement.
 * - If widgets are being moved to a new parent,
 * - update previous parents:
 *   - remove reference of the widget from children and layout props.
 * - update parentId in the moved widgets.
 * @param allWidgets | CanvasWidgetsReduxState : All widgets.
 * @param movedWidgets | string[] : List of widgets.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @returns CanvasWidgetsReduxState
 */
export function updateWidgetRelationships(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
): CanvasWidgetsReduxState {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Step 1: Update relationships with previous parents.
   */
  widgets = severTiesFromParents(widgets, movedWidgets);

  /**
   * Step 2: Update parentId of each moved widget.
   */
  widgets = linkWidgetsToNewParent(widgets, movedWidgets, highlight);

  return widgets;
}

/**
 * If widgets are being moved to a new parent,
 * - update previous parents:
 *   - remove reference of the widget from children and layout props.
 * @param allWidgets | CanvasWidgetsReduxState
 * @param movedWidgets | string[] : Ids of moved widgets
 * @returns CanvasWidgetsReduxState
 */
export function severTiesFromParents(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
): CanvasWidgetsReduxState {
  if (!movedWidgets?.length) return allWidgets;

  const widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Remove all moved widgets from their existing parent's children and layout.
   */
  movedWidgets.forEach((widgetId: string) => {
    // remove from previous parent
    const prevParentId = widgets[widgetId]?.parentId;

    if (prevParentId) {
      const prevParent: FlattenedWidgetProps = Object.assign(
        {},
        widgets[prevParentId],
      );

      if (prevParent.children) {
        const updatedPrevParent = {
          ...prevParent,
          children: prevParent.children.filter((each) => each !== widgetId),
          layout: deleteWidgetFromPreset(
            prevParent.layout,
            widgetId,
            widgets[widgetId].type,
          ),
        };

        widgets[prevParentId] = updatedPrevParent;
      }
    }
  });

  return widgets;
}

/**
 * Update parentId of each moved widget.
 * @param allWidgets | CanvasWidgetsReduxState : All widgets.
 * @param movedWidgets | string[] : List of widgets.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @returns CanvasWidgetsReduxState
 */
export function linkWidgetsToNewParent(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
): CanvasWidgetsReduxState {
  const widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const { canvasId } = highlight;

  movedWidgets.forEach((widgetId: string) => {
    if (widgets[widgetId]) {
      widgets[widgetId] = {
        ...widgets[widgetId],
        parentId: canvasId,
      };
    }
  });

  return widgets;
}

/**
 * Move existing widgets to a new place.
 * 1. If parent has changed, disconnect widgets from old parents and add to new parent.
 * 2. Update layouts accordingly.
 * @param allWidgets | CanvasWidgetsReduxState : All widgets.
 * @param movedWidgets | string[] : List of widgets.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @returns CanvasWidgetsReduxState
 */
export function moveWidgets(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
): CanvasWidgetsReduxState {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Step 1: Update relationships with previous parents.
   */
  widgets = updateWidgetRelationships(widgets, movedWidgets, highlight);

  /**
   * Step 2: Add widgets to the new parent.
   */
  widgets = addWidgetsToNewParent(widgets, movedWidgets, highlight);

  return widgets;
}

/**
 *
 * @param allWidgets | CanvasWidgetsReduxState : All widgets.
 * @param movedWidgets | string[] : List of widgets.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @returns CanvasWidgetsReduxState
 */
export function addWidgetsToNewParent(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
): CanvasWidgetsReduxState {
  const widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const parent: WidgetProps & {
    children?: string[] | undefined;
  } = widgets[highlight.canvasId];

  /**
   * Step 1: Create WidgetLayoutProps structure for addition to new parent's layout.
   */
  const newChildren: WidgetLayoutProps[] = transformMovedWidgets(
    allWidgets,
    movedWidgets,
    highlight,
  );

  /**
   * Step 2: Add widgets to preset of new parent at the drop position specified by the highlight.
   */
  const newLayout: LayoutProps[] = addWidgetsToPreset(
    parent.layout,
    highlight,
    newChildren,
  );

  /**
   * Step 3: Add all moved widgets to new parent and update its layout.
   */
  return {
    ...widgets,
    [parent.widgetId]: {
      ...parent,
      children: [...(parent?.children || []), ...movedWidgets],
      layout: newLayout,
    },
  };
}

/**
 * Transform movedWidgets (string[]) into WidgetLayoutProps[] structure.
 */
export function transformMovedWidgets(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
): WidgetLayoutProps[] {
  return movedWidgets.map((each: string) => ({
    alignment: highlight.alignment,
    widgetId: each,
    widgetType: allWidgets[each].type,
  }));
}
