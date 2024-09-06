import type { ImportBuildingBlockToApplicationResponse } from "ee/api/ApplicationApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getAction } from "ee/selectors/entitiesSelector";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "@shared/dsl/src/migrate/types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { ApiResponse } from "api/ApiResponses";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { Action } from "entities/Action";
import type { WidgetLayoutPositionInfo } from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { all, call, put, select } from "redux-saga/effects";
import { apiCallToSaveAction } from "sagas/ActionSagas";
import { accessNestedObjectValue } from "sagas/PasteWidgetUtils";
import { saveCopiedWidgets } from "utils/storage";

export function* saveBuildingBlockWidgetsToStore(
  response: ApiResponse<ImportBuildingBlockToApplicationResponse>,
) {
  const buildingBlockDsl = JSON.parse(response.data.widgetDsl);
  const buildingBlockWidgets = buildingBlockDsl.children;
  const flattenedBlockWidgets = buildingBlockWidgets.map(
    (widget: WidgetProps) => flattenDSL(widget),
  );

  const widgetsToPasteInCanvas: CopiedWidgetData[] = yield all(
    flattenedBlockWidgets.map((widget: FlattenedWidgetProps, index: number) => {
      const widgetPositionInfo: WidgetLayoutPositionInfo | null = null;
      return {
        hierarchy: getWidgetHierarchy(
          buildingBlockWidgets[index].type,
          buildingBlockWidgets[index].widgetId,
        ),
        list: Object.values(widget)
          .map((obj) => ({ ...obj }))
          .reverse(),
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: buildingBlockWidgets[index].widgetId,
        widgetPositionInfo,
      };
    }),
  );

  yield saveCopiedWidgets(
    JSON.stringify({
      widgets: widgetsToPasteInCanvas,
      flexLayers: [],
    }),
  );
}

export function updateWidgetsNameInNewQueries(
  oldWidgetName: string,
  newWidgetName: string,
  queries: Action[],
) {
  if (!oldWidgetName || !newWidgetName || !queries) {
    throw new Error(
      "Invalid input: oldWidgetName, newWidgetName, or queries are missing or empty",
    );
  }

  if (typeof oldWidgetName !== "string" || typeof newWidgetName !== "string") {
    throw new Error(
      "Invalid input: oldWidgetName and newWidgetName must be strings",
    );
  }

  if (!Array.isArray(queries)) {
    throw new Error("Invalid input: queries must be an array");
  }

  return queries
    .filter((query) => !!query)
    .map((query) => {
      if (!query.actionConfiguration && !query.jsonPathKeys) {
        return query;
      }
      query?.dynamicBindingPathList?.forEach((path: { key: string }) => {
        accessNestedObjectValue(
          query.actionConfiguration,
          path.key,
          oldWidgetName,
          newWidgetName,
        );
      });
      query.jsonPathKeys = query.jsonPathKeys.map((path: string) =>
        path.replaceAll(oldWidgetName, newWidgetName),
      );
      return query;
    });
}

// new actions needed after the drop of a block need to be added to the redux local state
export function* addNewlyAddedActionsToRedux(actions: Action[]) {
  for (const action of actions) {
    if (!action) {
      continue;
    }

    const existingAction: Action = yield select(getAction, action.id);
    if (existingAction) {
      continue;
    }

    try {
      const actionDataPayload = {
        isLoading: false,
        config: action,
        data: undefined,
      };

      yield put({
        type: ReduxActionTypes.APPEND_ACTION_AFTER_BUILDING_BLOCK_DROP,
        payload: {
          data: actionDataPayload,
        },
      });

      yield call(apiCallToSaveAction, action);
    } catch (error) {
      throw new Error("Error adding new action to Redux");
    }
  }
}
