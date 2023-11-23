import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { AnvilHighlightInfo, WidgetLayoutProps } from "../../anvilTypes";
import { deleteWidgetFromPreset } from "./deletionUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import { addWidgetsToPreset } from "./additionUtils";

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
  const widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const { canvasId } = highlight;
  // Check if parent has changed
  const orphans: string[] = movedWidgets.filter(
    (item) => widgets[item].parentId !== canvasId,
  );
  if (orphans && orphans.length) {
    //parent has changed
    orphans.forEach((widgetId: string) => {
      // remove from previous parent
      const prevParentId = widgets[widgetId]?.parentId;
      if (prevParentId) {
        const prevParent = Object.assign({}, widgets[prevParentId]);
        if (prevParent.children) {
          const updatedPrevParent = {
            ...prevParent,
            children: prevParent.children.filter((each) => each !== widgetId),
            layout: deleteWidgetFromPreset(prevParent.layout, widgetId),
          };
          widgets[prevParentId] = updatedPrevParent;
        }
      }

      // add to new parent
      widgets[widgetId] = {
        ...widgets[widgetId],
        parentId: canvasId,
      };
    });
  }

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
   * Step 2: Remove from new parent's layouts, the moved widgets that are already present in it.
   */
  const parent: WidgetProps & {
    children?: string[] | undefined;
  } = widgets[highlight.canvasId];

  // Extract moved child widgets of new parent.
  const movedChildren: string[] = movedWidgets.filter((each: string) =>
    (parent?.children || []).includes(each),
  );
  let updatedParentLayout = [...parent.layout];
  movedChildren.forEach((each: string) => {
    // Remove each moved child from the layout
    updatedParentLayout = deleteWidgetFromPreset(updatedParentLayout, each);
  });

  /**
   * Step 3: Create WidgetLayoutProps structure for addition to new parent's layout.
   */
  const newChildren: WidgetLayoutProps[] = movedWidgets.map((each: string) => ({
    widgetId: each,
    alignment: highlight.alignment,
  }));

  const newLayout = addWidgetsToPreset(
    updatedParentLayout,
    highlight,
    newChildren,
  );

  /**
   * Step 4: Add all moved widgets to new parent and update its layout in the drop position specified by the highlight.
   */
  return {
    ...widgets,
    [parent.widgetId]: {
      ...parent,
      children: [
        ...(parent?.children || []).filter(
          (each: string) => !movedWidgets.includes(each),
        ),
        ...movedWidgets,
      ],
      layout: newLayout,
    },
  };
}
