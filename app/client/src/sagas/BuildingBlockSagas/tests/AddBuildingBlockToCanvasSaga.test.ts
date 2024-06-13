import type { CallEffect, PutEffect, SelectEffect } from "redux-saga/effects";
import { call, select } from "redux-saga/effects";
import {
  addBuildingBlockToCanvasSaga,
  loadBuildingBlocksIntoApplication,
} from "../BuildingBlockAdditionSagas";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { WidgetAddChild } from "actions/pageActions";
import { addChildSaga } from "sagas/WidgetAdditionSagas";
import { getDragDetails, getWidgetByName } from "sagas/selectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import { addEntityAction, skeletonWidget } from "./fixtures";

type GeneratorType = Generator<
  CallEffect | SelectEffect | PutEffect,
  void,
  unknown
>;

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

  it("2. should handle errors gracefully", () => {
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
