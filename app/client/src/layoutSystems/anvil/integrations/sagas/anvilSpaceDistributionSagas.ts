import { all, put, select, takeLatest } from "redux-saga/effects";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { getWidgets } from "sagas/selectors";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { updateAndSaveLayout } from "actions/pageActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

/**
 * function to redistribute spaces among zones within a section.
 * @param action - Redux action containing the section layout ID and the distributed space for each zone.
 */
function* reDistributeZoneSpaces(
  action: ReduxAction<{
    sectionLayoutId: string;
    zonesDistributed: {
      [key: string]: number;
    };
  }>,
) {
  const { zonesDistributed } = action.payload;

  // Retrieve the current state of all widgets
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Create a copy of the widgets to update
  let updatedWidgets = { ...allWidgets };

  // Extract allocated zone IDs from the action payload
  const allocatedZoneIds = Object.keys(zonesDistributed);

  // Determine the section widget ID based on the first allocated zone ID or use a default if none are available
  const sectionWidgetId =
    updatedWidgets[allocatedZoneIds[0]]?.parentId || MAIN_CONTAINER_WIDGET_ID;

  // Retrieve the section parent widget
  const sectionParent = updatedWidgets[sectionWidgetId];

  // Initialize the updated widgets with cleared space distribution for the section parent
  updatedWidgets = {
    ...updatedWidgets,
    [sectionWidgetId]: {
      ...sectionParent,
      spaceDistributed: {},
    },
  };

  // Iterate through all zone IDs in the section
  const allZoneIds = sectionParent.children || [];
  allZoneIds.forEach((zoneId) => {
    let zoneWidget = updatedWidgets[zoneId];

    // If the zone widget exists, update its flexGrow based on the distributed spaces
    if (zoneWidget) {
      const spaces = zonesDistributed[zoneId];
      if (spaces) {
        zoneWidget = {
          ...zoneWidget,
          flexGrow: spaces,
        };
      }
    }

    // Update the widgets with the changes for the current zone
    updatedWidgets = {
      ...updatedWidgets,
      [zoneId]: {
        ...zoneWidget,
      },
      [sectionWidgetId]: {
        ...updatedWidgets[sectionWidgetId],
        spaceDistributed: {
          ...updatedWidgets[sectionWidgetId].spaceDistributed,
          [zoneId]: zoneWidget?.flexGrow,
        },
      },
    };
  });

  // Dispatch an action to update and save the layout with the modified widgets
  yield put(updateAndSaveLayout(updatedWidgets));
}

export default function* anvilSpaceDistributionSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_UPDATE,
      reDistributeZoneSpaces,
    ),
  ]);
}
