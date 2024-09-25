import { call, put, select } from "redux-saga/effects";
import { updateAndSaveLayout } from "actions/pageActions";
import { updateAnvilParentPostWidgetDeletion } from "layoutSystems/anvil/utils/layouts/update/deletionUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { anvilWidgets } from "modules/ui-builder/ui/wds/constants";
import {
  updateSectionWithDefaultSpaceDistribution,
  updateSectionsDistributedSpace,
} from "layoutSystems/anvil/sectionSpaceDistributor/utils/spaceRedistributionSagaUtils";
import { getIsAnvilLayout } from "../integrations/selectors";

export function* updateAndSaveAnvilLayout(
  widgets: CanvasWidgetsReduxState,
  options?: { isRetry: boolean; shouldReplay: boolean },
) {
  const isAnvilLayout: boolean = yield select(getIsAnvilLayout);

  if (!isAnvilLayout || !widgets) {
    yield put(updateAndSaveLayout(widgets, options));

    return;
  }

  let updatedWidgets: CanvasWidgetsReduxState = { ...widgets };

  /**
   * Extract all section widgets
   */
  const sections: FlattenedWidgetProps[] = Object.values(widgets).filter(
    (each: FlattenedWidgetProps) => each.type === anvilWidgets.SECTION_WIDGET,
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
      // update the section with the new space distribution
      updatedWidgets = yield call(
        updateSectionsDistributedSpace,
        updatedWidgets,
        each,
      );
      /**
       * If section's zone count doesn't match it's child count,
       * => update the zone count.
       */
      updatedWidgets = {
        ...updatedWidgets,
        [each.widgetId]: {
          ...updatedWidgets[each.widgetId],
          zoneCount: each.children?.length,
        },
      };
    } else if (!each.spaceDistributed) {
      // update the section with the default space distribution
      updatedWidgets = yield call(
        updateSectionWithDefaultSpaceDistribution,
        updatedWidgets,
        each,
      );
    }
  }

  yield put(updateAndSaveLayout(updatedWidgets, options));
}
