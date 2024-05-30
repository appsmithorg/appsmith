import { put } from "redux-saga/effects";
import { removeSkeletonLoaderFromCanvas } from "./BuildingBlockAdditionSagas";
import { modifyMetaWidgets } from "actions/metaWidgetActions";
import type { WidgetAddChild } from "actions/pageActions";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

describe("removeSkeletonLoaderFromCanvas", () => {
  const newWidget = {
    widgetId: "0",
    type: "SKELETON_WIDGET",
    leftColumn: 13,
    topRow: 9,
    columns: 31,
    rows: 70,
    parentRowSpace: 10,
    parentColumnSpace: 11.9375,
    newWidgetId: "btemn38yo4",
  };

  it("should remove skeleton loader when hasReflow is true", () => {
    const generator = removeSkeletonLoaderFromCanvas(
      newWidget as WidgetAddChild,
      true,
    );

    // Step 1: put WIDGET_SINGLE_DELETE action
    let result = generator.next();
    expect(result.value).toEqual(
      put({
        type: WidgetReduxActionTypes.WIDGET_SINGLE_DELETE,
        payload: {
          widgetId: newWidget.newWidgetId,
          parentId: newWidget.widgetId,
          disallowUndo: true,
          isShortcut: false,
        },
      }),
    );

    // Ensure the saga is done
    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("should handle removing meta widget when hasReflow is false", () => {
    const generator = removeSkeletonLoaderFromCanvas(
      newWidget as WidgetAddChild,
      false,
    );

    // Step 1: select getMetaWidget
    let result = generator.next();
    expect(result.value).toEqual(
      expect.objectContaining({
        "@@redux-saga/IO": true,
        combinator: false,
        type: "SELECT",
        payload: {
          selector: expect.any(Function),
          args: [],
        },
      }),
    );

    // Mock data for the selected meta widget
    const metaWidget = {
      isVisible: true,
      type: "SKELETON_WIDGET",
      isLoading: false,
      widgetName: "Skeleton1",
      version: 1,
      hideCard: true,
      isDeprecated: false,
      displayName: "Skeleton",
      key: "6qoj4m6q7y",
      needsErrorInfo: false,
      onCanvasUI: {
        selectionBGCSSVar: "--on-canvas-ui-widget-selection",
        focusBGCSSVar: "--on-canvas-ui-widget-focus",
        selectionColorCSSVar: "--on-canvas-ui-widget-focus",
        focusColorCSSVar: "--on-canvas-ui-widget-selection",
        disableParentSelection: false,
      },
      widgetId: "wm1mf6kmy5",
      renderMode: "CANVAS",
      parentColumnSpace: 11.9375,
      parentRowSpace: 10,
      leftColumn: 12,
      rightColumn: 43,
      topRow: 7,
      bottomRow: 70,
      mobileLeftColumn: 12,
      mobileRightColumn: 43,
      mobileTopRow: 7,
      mobileBottomRow: 70,
      parentId: "0",
      dynamicBindingPathList: [],
      isMetaWidget: true,
      creatorId: "0",
    };

    // Step 2: proceed with the selected meta widget
    result = generator.next(metaWidget as FlattenedWidgetProps);
    expect(result.value).toEqual(
      put(
        modifyMetaWidgets({
          addOrUpdate: {
            [newWidget.newWidgetId]: metaWidget as FlattenedWidgetProps,
          },
          deleteIds: [newWidget.newWidgetId],
        }),
      ),
    );

    // Ensure the saga is done
    result = generator.next();
    expect(result.done).toBe(true);
  });

  it("should handle errors gracefully", () => {
    const generator = removeSkeletonLoaderFromCanvas(
      newWidget as WidgetAddChild,
      true,
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
