import { call, put } from "redux-saga/effects";
import { addBuildingBlockSkeletonLoaderToCanvas } from "./BuildingBlockAdditionSagas";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { modifyMetaWidgets } from "actions/metaWidgetActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetAddChild } from "actions/pageActions";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

describe("addBuildingBlockSkeletonLoaderToCanvas", () => {
  const addSkeletonAction = {
    type: "WIDGET_ADD_CHILD",
    payload: {
      widgetId: "0",
      type: "SKELETON_WIDGET",
      leftColumn: 13,
      topRow: 9,
      columns: 31,
      rows: 70,
      parentRowSpace: 10,
      parentColumnSpace: 11.9375,
      newWidgetId: "btemn38yo4",
    },
  };

  it("should add the skeleton loader to the canvas", () => {
    const generator = addBuildingBlockSkeletonLoaderToCanvas(
      addSkeletonAction as ReduxAction<WidgetAddChild>,
    );

    // Step 1: call getUpdateDslAfterCreatingChild with the action payload
    let result = generator.next();
    expect(result.value).toEqual(
      call(
        getUpdateDslAfterCreatingChild,
        addSkeletonAction.payload as WidgetAddChild,
      ),
    );

    interface UpdatedWidgets {
      [widgetId: string]: FlattenedWidgetProps;
    }

    // Mock data for updated widgets
    const updatedWidgets = {
      "0": {
        widgetName: "MainContainer",
        backgroundColor: "none",
        rightColumn: 1224,
        renderMode: "CANVAS",
        isLoading: false,
        snapColumns: 64,
        detachFromLayout: true,
        widgetId: "0",
        topRow: 0,
        bottomRow: 380,
        containerStyle: "none",
        snapRows: 79,
        parentRowSpace: 1,
        type: "CANVAS_WIDGET",
        canExtend: true,
        version: 89,
        minHeight: 810,
        parentColumnSpace: 1,
        dynamicBindingPathList: [],
        leftColumn: 0,
        children: ["35zy1mts9q"],
      },
      "35zy1mts9q": {
        isVisible: true,
        type: "SKELETON_WIDGET",
        isLoading: false,
        widgetName: "Skeleton1",
        version: 1,
        hideCard: true,
        isDeprecated: false,
        displayName: "Skeleton",
        key: "o0gfgt3twy",
        needsErrorInfo: false,
        onCanvasUI: {
          selectionBGCSSVar: "--on-canvas-ui-widget-selection",
          focusBGCSSVar: "--on-canvas-ui-widget-focus",
          selectionColorCSSVar: "--on-canvas-ui-widget-focus",
          focusColorCSSVar: "--on-canvas-ui-widget-selection",
          disableParentSelection: false,
        },
        widgetId: "35zy1mts9q",
        renderMode: "CANVAS",
        parentColumnSpace: 11.9375,
        parentRowSpace: 10,
        leftColumn: 12,
        rightColumn: 43,
        topRow: 11,
        bottomRow: 74,
        mobileLeftColumn: 12,
        mobileRightColumn: 43,
        mobileTopRow: 11,
        mobileBottomRow: 74,
        parentId: "0",
        dynamicBindingPathList: [],
      },
    } as UpdatedWidgets;

    // Step 2: proceed with the updated widgets
    result = generator.next(updatedWidgets);
    expect(result.value).toEqual(
      put(
        modifyMetaWidgets({
          addOrUpdate: {
            [addSkeletonAction.payload.newWidgetId]:
              updatedWidgets[addSkeletonAction.payload.newWidgetId],
          },
          creatorId: addSkeletonAction.payload.widgetId,
          deleteIds: [],
        }),
      ),
    );

    // Ensure the saga is done
    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("should handle errors gracefully", () => {
    const generator = addBuildingBlockSkeletonLoaderToCanvas(
      addSkeletonAction as ReduxAction<WidgetAddChild>,
    );

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
