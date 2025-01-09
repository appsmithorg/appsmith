import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "../../../actions/ReduxActionTypes";
import { getAction } from "ee/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import type { WidgetAddChild } from "actions/pageActions";
import type { Action } from "entities/Action";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { CallEffect, PutEffect, SelectEffect } from "redux-saga/effects";
import { call, put, select } from "redux-saga/effects";
import { apiCallToSaveAction } from "sagas/ActionSagas";
import { addWidgetAndMoveWidgetsSaga } from "sagas/CanvasSagas/DraggingCanvasSagas";
import { addChildSaga } from "sagas/WidgetAdditionSagas";
import { getDragDetails, getWidgetByName } from "sagas/selectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import { addNewlyAddedActionsToRedux, updateWidgetsNameInNewQueries } from "..";
import {
  addAndMoveBuildingBlockToCanvasSaga,
  addBuildingBlockToCanvasSaga,
  loadBuildingBlocksIntoApplication,
} from "../BuildingBlockAdditionSagas";
import {
  actionPayload,
  addEntityAction,
  newlyCreatedActions,
  skeletonWidget,
} from "./fixtures";

type GeneratorType = Generator<
  CallEffect | SelectEffect | PutEffect,
  void,
  unknown
>;

describe("addAndMoveBuildingBlockToCanvasSaga", () => {
  it("1. should add a skeleton widget and move existing widgets appropriately", () => {
    const generator: GeneratorType =
      addAndMoveBuildingBlockToCanvasSaga(actionPayload);

    // Step 1: select getCurrentApplicationId
    let result = generator.next();

    expect(result.value).toEqual(select(getCurrentApplicationId));

    // Mock return value of getCurrentApplicationId
    const applicationId = "app1";

    result = generator.next(applicationId);
    expect(result.value).toEqual(select(getCurrentWorkspaceId));

    // Step 2: select getCurrentWorkspaceId
    const workspaceId = "workspace1";

    result = generator.next(workspaceId);
    expect(result.value).toEqual(select(getDragDetails));

    // Step 3: select getDragDetails
    const dragDetails: DragDetails = {
      newWidget: {
        displayName: "TestWidget",
      },
    };

    result = generator.next(dragDetails);

    // Generating the skeletonWidgetName
    const buildingblockName = dragDetails.newWidget.displayName;
    const skeletonWidgetName = `loading_${buildingblockName.toLowerCase().replace(/ /g, "_")}`;

    const updatedActionPayload = {
      ...actionPayload,
      payload: {
        ...actionPayload.payload,
        shouldReplay: false,
        newWidget: {
          ...actionPayload.payload.newWidget,
          type: "SKELETON_WIDGET",
          widgetName: skeletonWidgetName,
        },
      },
    };

    // Step 4: call addWidgetAndMoveWidgetsSaga
    expect(result.value).toEqual(
      call(addWidgetAndMoveWidgetsSaga, updatedActionPayload),
    );

    // Step 5: call initiateBuildingBlockDropEvent
    result = generator.next();
    expect(result.value).toEqual(
      call(initiateBuildingBlockDropEvent, {
        applicationId,
        workspaceId,
        buildingblockName,
      }),
    );

    // Step 6: select getWidgetByName
    result = generator.next();
    expect(result.value).toEqual(select(getWidgetByName, skeletonWidgetName));

    result = generator.next(skeletonWidget);

    // Step 7: call loadBuildingBlocksIntoApplication
    expect(result.value).toEqual(
      call(
        loadBuildingBlocksIntoApplication,
        {
          ...actionPayload.payload.newWidget,
          widgetId: actionPayload.payload.canvasId,
        },
        skeletonWidget.widgetId,
      ),
    );

    // Complete the generator
    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("2. should handle add and move errors gracefully", () => {
    const generator: GeneratorType =
      addAndMoveBuildingBlockToCanvasSaga(actionPayload);

    generator.next();
    // Introduce an error by throwing one manually
    const error = new Error("Something went wrong");

    try {
      generator.throw(error);
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});

describe("addBuildingBlockToCanvasSaga", () => {
  it("1. should add a skeleton widget and initiate a building block drop", () => {
    const generator: GeneratorType =
      addBuildingBlockToCanvasSaga(addEntityAction);

    // Step 1: select getCurrentApplicationId
    let result = generator.next();

    expect(result.value).toEqual(select(getCurrentApplicationId));

    // Mock return value of getCurrentApplicationId
    const applicationId = "app1";

    result = generator.next(applicationId);
    expect(result.value).toEqual(select(getCurrentWorkspaceId));

    // Step 2: select getCurrentWorkspaceId
    const workspaceId = "workspace1";

    result = generator.next(workspaceId);
    expect(result.value).toEqual(select(getDragDetails));

    // Step 3: select getDragDetails
    const dragDetails = {
      newWidget: {
        displayName: "TestWidget",
      },
    };

    result = generator.next(dragDetails);

    // Generating the skeletonWidgetName
    const buildingblockName = dragDetails.newWidget.displayName;
    const skeletonWidgetName = `loading_${buildingblockName.toLowerCase().replace(/ /g, "_")}`;

    const addSkeletonWidgetAction: ReduxAction<
      WidgetAddChild & { shouldReplay: boolean }
    > = {
      ...addEntityAction,
      payload: {
        ...addEntityAction.payload,
        type: "SKELETON_WIDGET",
        widgetName: skeletonWidgetName,
        shouldReplay: false,
      },
    };

    // Step 4: call initiateBuildingBlockDropEvent
    expect(result.value).toEqual(
      call(initiateBuildingBlockDropEvent, {
        applicationId,
        workspaceId,
        buildingblockName,
      }),
    );

    // Step 5: call addChildSaga
    result = generator.next();
    expect(result.value).toEqual(call(addChildSaga, addSkeletonWidgetAction));

    // Step 6: select getWidgetByName
    result = generator.next();
    expect(result.value).toEqual(select(getWidgetByName, skeletonWidgetName));

    result = generator.next(skeletonWidget);

    // Step 7: call loadBuildingBlocksIntoApplication
    expect(result.value).toEqual(
      call(
        loadBuildingBlocksIntoApplication,
        addEntityAction.payload,
        skeletonWidget.widgetId,
      ),
    );

    // Complete the generator
    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("2. should handle add errors gracefully", () => {
    const generator: GeneratorType =
      addBuildingBlockToCanvasSaga(addEntityAction);

    generator.next();
    // Introduce an error by throwing one manually
    const error = new Error("Something went wrong");

    try {
      generator.throw(error);
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});

describe("addNewlyAddedActionsToRedux", () => {
  it("1. should add new actions to Redux if they do not already exist", () => {
    const existingAction = undefined;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generator: any = addNewlyAddedActionsToRedux(newlyCreatedActions);

    for (const action of newlyCreatedActions) {
      expect(generator.next().value).toEqual(select(getAction, action.id));
      expect(generator.next(existingAction).value).toEqual(
        put({
          type: ReduxActionTypes.APPEND_ACTION_AFTER_BUILDING_BLOCK_DROP,
          payload: {
            data: {
              isLoading: false,
              config: action,
              data: undefined,
            },
          },
        }),
      );
      expect(generator.next().value).toEqual(call(apiCallToSaveAction, action));
    }

    expect(generator.next().done).toBe(true);
  });
  it("2. should handle empty actions array gracefully", () => {
    const actions: Action[] = [];
    const generator = addNewlyAddedActionsToRedux(actions);

    expect(generator.next().done).toBe(true);
  });
});

describe("updateWidgetsNameInNewQueries", () => {
  it("1. should replace oldWidgetName with newWidgetName in actionConfiguration.body", () => {
    const oldWidgetName = "tbl_usersCopy4";
    const newWidgetName = "tbl_usersCopy5";
    const queries: Action[] = newlyCreatedActions;

    const updatedQueries = updateWidgetsNameInNewQueries(
      oldWidgetName,
      newWidgetName,
      queries,
    );

    expect(updatedQueries[0].actionConfiguration.body).toBe(
      'SELECT * FROM user_data WHERE name ILIKE \'{{"%" + (tbl_usersCopy5.searchText || "") + "%"}}',
    );
    expect(updatedQueries[0].jsonPathKeys[0]).toBe(
      "dat_bornAfterCopy4.selectedDate",
    );
  });

  it("2. should return an empty array when queries array is empty", () => {
    const oldWidgetName = "OldWidget";
    const newWidgetName = "NewWidget";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queries: any[] = [];

    const updatedQueries = updateWidgetsNameInNewQueries(
      oldWidgetName,
      newWidgetName,
      queries,
    );

    expect(updatedQueries).toEqual([]);
  });
});
