import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { WidgetAddChild } from "actions/pageActions";
import type { WidgetDraggingUpdateParams } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { CallEffect, PutEffect, SelectEffect } from "redux-saga/effects";
import { call, select } from "redux-saga/effects";
import { addWidgetAndMoveWidgetsSaga } from "sagas/CanvasSagas/DraggingCanvasSagas";
import { getDragDetails, getWidgetByName } from "sagas/selectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { initiateBuildingBlockDropEvent } from "utils/buildingBlockUtils";
import {
  addAndMoveBuildingBlockToCanvasSaga,
  loadBuildingBlocksIntoApplication,
} from "../BuildingBlockAdditionSagas";
import { skeletonWidget } from "./fixtures";

type GeneratorType = Generator<
  CallEffect | SelectEffect | PutEffect,
  void,
  unknown
>;

describe("addAndMoveBuildingBlockToCanvasSaga", () => {
  const actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[];
    canvasId: string;
  }> = {
    type: "WIDGETS_ADD_CHILD_AND_MOVE",
    payload: {
      newWidget: {
        type: "BUILDING_BLOCK",
        leftColumn: 21,
        topRow: 147,
        columns: 31,
        rows: 63,
        parentRowSpace: 10,
        parentColumnSpace: 13.40625,
        newWidgetId: "9lg3rb7mi2",
        widgetId: "0",
        tabId: "0",
      },
      draggedBlocksToUpdate: [
        {
          left: 388.78125,
          top: 1430,
          width: 214.5,
          height: 40,
          columnWidth: 13.40625,
          rowHeight: 10,
          widgetId: "6b6kauwlxa",
          isNotColliding: true,
          type: "BUTTON_WIDGET",
          updateWidgetParams: {
            operation: "MOVE",
            widgetId: "6b6kauwlxa",
            payload: {
              leftColumn: 29,
              topRow: 143,
              bottomRow: 147,
              rightColumn: 45,
              parentId: "0",
              newParentId: "0",
            },
          },
        },
      ],
      canvasId: "0",
    },
  };

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

  it("2. should handle errors gracefully", () => {
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
