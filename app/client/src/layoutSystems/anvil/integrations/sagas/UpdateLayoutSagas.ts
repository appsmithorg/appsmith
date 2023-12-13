import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { updateAndSaveLayout } from "actions/pageActions";
import {
  ReduxActionErrorTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { updateAnvilParentPostWidgetDeletion } from "layoutSystems/anvil/utils/layouts/update/deletionUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select, takeLatest } from "redux-saga/effects";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { all } from "axios";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

// Saga function to update and save the Anvil layout
function* updateAndSaveAnvilLayoutSaga(
  action: ReduxAction<{
    isRetry?: boolean; // Flag indicating whether this is a retry attempt
    widgets: CanvasWidgetsReduxState; // Updated state of all widgets
    shouldReplay?: boolean; // Flag indicating whether to replay events
    updatedWidgetIds?: string[]; // IDs of widgets that have been updated
  }>,
) {
  try {
    const { widgets } = action.payload;

    // Retrieve the layout system type
    const layoutSystemType: LayoutSystemTypes =
      yield select(getLayoutSystemType);

    // If the layout system is not Anvil or if there are no updated widgets, update and save the layout
    if (layoutSystemType !== LayoutSystemTypes.ANVIL || !widgets) {
      yield put(updateAndSaveLayout(widgets));
    }

    let updatedWidgets: CanvasWidgetsReduxState = { ...widgets };

    /**
     * Extract all section widgets
     */
    const sections: FlattenedWidgetProps[] = Object.values(widgets).filter(
      (each: FlattenedWidgetProps) => each.type === SectionWidget.type,
    );

    for (const each of sections) {
      const children: string[] | undefined = each.children;

      /**
       * If a section doesn't have any children,
       * => delete it.
       */
      if (!children || !children?.length) {
        let parent: FlattenedWidgetProps =
          updatedWidgets[each.parentId || MAIN_CONTAINER_WIDGET_ID];

        if (parent) {
          parent = {
            ...parent,
            children: parent.children?.filter(
              (id: string) => id !== each.widgetId,
            ),
          };

          delete updatedWidgets[each.widgetId];
          updatedWidgets = updateAnvilParentPostWidgetDeletion(
            { ...updatedWidgets, [parent.widgetId]: parent },
            parent.widgetId,
            each.widgetId,
            each.type,
          );
        }
      } else if (each.zoneCount !== each.children?.length) {
        /**
         * If section's zone count doesn't match its child count,
         * => update the zone count.
         */
        updatedWidgets = {
          ...updatedWidgets,
          [each.widgetId]: {
            ...each,
            zoneCount: each.children?.length,
          },
        };
      }
    }

    // Update and save the layout
    yield put(updateAndSaveLayout(updatedWidgets));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
        error,
      },
    });
  }
}

export default function* anvilUpdateLayoutSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
      updateAndSaveAnvilLayoutSaga,
    ),
  ]);
}
