import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import { updateAndSaveLayout } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import {
  MAX_ZONE_COUNT,
  MIN_ZONE_COUNT,
} from "layoutSystems/anvil/utils/constants";
import {
  addNewZonesToSection,
  mergeLastZonesOfSection,
} from "layoutSystems/anvil/utils/sectionOperationUtils";
import type { WidgetLayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import {
  getDefaultSpaceDistributed,
  redistributeSpaceWithDynamicMinWidth,
} from "layoutSystems/anvil/sectionSpaceDistributor/utils/spaceRedistributionSagaUtils";
import { ZoneMinColumnWidth } from "layoutSystems/anvil/sectionSpaceDistributor/constants";

// function to update the zone count of a section widget
function* updateZonesCountOfSectionSaga(
  actionPayload: ReduxAction<{
    zoneCount: number; // New zone count for the section
    sectionWidgetId: string; // ID of the section widget
  }>,
) {
  try {
    const { sectionWidgetId, zoneCount } = actionPayload.payload;

    // Check if the provided zone count is within the valid range (1 to 4)
    if (zoneCount <= MAX_ZONE_COUNT && zoneCount >= MIN_ZONE_COUNT) {
      // Fetch all widgets from the Redux store
      const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

      // Fetch the section widget using its ID
      const sectionWidget: FlattenedWidgetProps = allWidgets[sectionWidgetId];

      // Proceed only if the section widget and its children exist
      if (sectionWidget && sectionWidget.children) {
        // Determine the current zones' order within the section
        const zoneOrder: string[] = sectionWidget.layout[0].layout.map(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (each: any) => each.widgetId,
        );

        const currentZoneCount: number = zoneOrder ? zoneOrder.length : 0;
        let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

        // Adjust zones based on the difference between current and new zone counts
        if (currentZoneCount > zoneCount) {
          // Merge the last zones if the new count is less than the current count
          updatedWidgets = yield call(
            mergeLastZonesOfSection,
            currentZoneCount - zoneCount,
            zoneOrder,
          );
        } else if (currentZoneCount < zoneCount) {
          // Add new zones if the new count is more than the current count
          const updatedObj: {
            updatedWidgets: CanvasWidgetsReduxState;
            zoneIdsCreated: string[];
          } = yield call(
            addNewZonesToSection,
            sectionWidgetId,
            zoneCount - currentZoneCount,
          );

          updatedWidgets = updatedObj.updatedWidgets;
        }

        // Determine space distribution based on zone adjustments
        const previousZoneOrder = sectionWidget.layout[0].layout.map(
          (each: WidgetLayoutProps) => each.widgetId,
        );
        const currentDistributedSpace =
          sectionWidget.spaceDistributed ||
          getDefaultSpaceDistributed(previousZoneOrder);

        // Redistribute space across zones with dynamic minimum width
        const updatedZoneOrder: string[] = updatedWidgets[
          sectionWidgetId
        ].layout[0].layout.map((each: WidgetLayoutProps) => each.widgetId);
        const updatedDistributedSpaceArray =
          redistributeSpaceWithDynamicMinWidth(
            currentDistributedSpace,
            previousZoneOrder,
            currentZoneCount > zoneCount
              ? -ZoneMinColumnWidth
              : ZoneMinColumnWidth,
            currentZoneCount > zoneCount
              ? currentZoneCount - 1
              : currentZoneCount,
            {
              addedViaStepper: true,
            },
          );

        // Update space distribution for each child widget
        const updatedDistributedSpace = updatedZoneOrder.reduce(
          (result, each, index) => {
            return {
              ...result,
              [each]: updatedDistributedSpaceArray[index],
            };
          },
          {} as { [key: string]: number },
        );

        // Update each child widget's flexGrow property based on the redistributed space
        const childrenToUpdate = updatedWidgets[sectionWidgetId].children || [];

        childrenToUpdate.forEach((each) => {
          updatedWidgets[each] = {
            ...updatedWidgets[each],
            flexGrow: updatedDistributedSpace[each],
          };
          updatedWidgets[sectionWidgetId] = {
            ...updatedWidgets[sectionWidgetId],
            spaceDistributed: {
              ...updatedWidgets[sectionWidgetId].spaceDistributed,
              [each]: updatedDistributedSpace[each],
            },
            zoneCount,
          };
        });

        // Update the section widget's zone count and save the updated layout
        updatedWidgets[sectionWidgetId] = {
          ...updatedWidgets[sectionWidgetId],
          zoneCount,
        };
        yield put(updateAndSaveLayout(updatedWidgets));
      }
    }
  } catch (error) {
    // Handle any errors that occur during the process
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
        error,
      },
    });
  }
}

export default function* anvilSectionSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
      updateZonesCountOfSectionSaga,
    ),
  ]);
}
