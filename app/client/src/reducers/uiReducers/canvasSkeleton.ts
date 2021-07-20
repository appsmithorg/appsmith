import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetSkeleton } from "widgets/BaseWidget";
// import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
// import { get } from "lodash";

export interface CanvasSkeletonReduxState {
  tree: WidgetSkeleton;
}

const initialState: CanvasSkeletonReduxState = {
  tree: { widgetId: "0", children: [], type: "CANVAS_WIDGET" },
};

const canvasSkeletonReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_LAYOUT]: () => {
    // const { widgets } = action.payload;
    // const currentChildren = widgets[MAIN_CONTAINER_WIDGET_ID].children;
    // currentChildren.forEach((childWidgetId: string) => {
    //   const existingEntryIndex = state.tree.children?.findIndex(
    //     (child: WidgetSkeleton) => child.widgetId === childWidgetId,
    //   );
    //   const childWidget = widgets[childWidgetId];
    //   if (existingEntryIndex && existingEntryIndex > -1) {
    //     const existingEntry = get(state.tree.children, [existingEntryIndex]);
    //     if (existingEntry) {
    //       if (existingEntry.parentId !== childWidget.parentId) {
    //         existingEntry.parentId = childWidget.parentId;
    //       }
    //       if (existingEntry.type !== childWidget.type) {
    //         existingEntry.type = childWidget.type;
    //       }
    //     }
    //   }
    // });
  },
});

export default canvasSkeletonReducer;
