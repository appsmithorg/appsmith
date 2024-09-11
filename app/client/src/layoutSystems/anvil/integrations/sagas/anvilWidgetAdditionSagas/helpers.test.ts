import type { WidgetProps } from "widgets/BaseWidget";
import {
  addChildReferenceToParent,
  getUniqueWidgetName,
  runBlueprintOperationsOnWidgets,
  updateWidgetListWithNewWidget,
} from "./helpers";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { expectSaga } from "redux-saga-test-plan";
import { select } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import WidgetFactory from "WidgetProvider/factory";

describe("addChildReferenceToParent", () => {
  it("should add a new child reference to the parent widget", () => {
    const widgets: Record<string, Partial<WidgetProps>> = {
      parentId: {
        widgetId: "parentId",
        children: [],
      },
      childWidgetId: {
        widgetId: "childWidgetId",
      },
    };

    const updatedWidgets = addChildReferenceToParent(
      widgets as CanvasWidgetsReduxState,
      "parentId",
      "childWidgetId",
    );

    expect(updatedWidgets["parentId"].children).toContain("childWidgetId");
  });

  it("should handle parent widget without children property", () => {
    const widgets: Record<string, Partial<WidgetProps>> = {
      parentId: {
        widgetId: "parentId",
      },
      childWidgetId: {
        widgetId: "childWidgetId",
      },
    };

    const updatedWidgets = addChildReferenceToParent(
      widgets as CanvasWidgetsReduxState,
      "parentId",
      "childWidgetId",
    );

    expect(updatedWidgets["parentId"].children).toContain("childWidgetId");
  });
});

describe("getUniqueWidgetName", () => {
  it("should generate a unique widget name within the dataTree", async () => {
    const prefix = "widget";
    const result = await expectSaga(getUniqueWidgetName, prefix)
      .provide([[select(getDataTree), { someWidget: {} }]])
      .run();

    expect(result.returnValue).toBe("widget1");
  });

  it("should handle multiple widgets with the same prefix", async () => {
    const prefix = "widget";
    const result = await expectSaga(getUniqueWidgetName, prefix)
      .provide([[select(getDataTree), { widget1: {}, widget2: {} }]])
      .run();

    expect(result.returnValue).toBe("widget3");
  });
});

describe("runBlueprintOperationsOnWidgets", () => {
  it("should call executeWidgetBlueprintOperations with the blueprint operations and widgets", async () => {
    const widgets: Record<string, Partial<WidgetProps>> = {
      widgetId: {
        widgetId: "widgetId",
      },
    };
    const blueprint = {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: () => [
            {
              widgetId: "widgetId",
              propertyName: "isOpen",
              propertyValue: true,
            },
          ],
        },
      ],
    };

    const expected = {
      widgetId: {
        widgetId: "widgetId",
        isOpen: true,
      },
    };

    const result = await expectSaga(
      runBlueprintOperationsOnWidgets,
      widgets as CanvasWidgetsReduxState,
      "widgetId",
      blueprint,
    )
      .provide([[select(getLayoutSystemType), "ANVIL"]])
      .run();

    expect(result.returnValue).toStrictEqual(expected);
  });
});

describe("updateWidgetListWithNewWidget", () => {
  it("should updated list of widgets correctly with the new widget", async () => {
    const blueprint = {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: () => [
            {
              widgetId: "newWidgetId",
              propertyName: "isOpen",
              propertyValue: true,
            },
          ],
        },
      ],
    };
    WidgetFactory.widgetDefaultPropertiesMap.get = jest.fn(() => ({
      someRandomProperty: "random",
      widgetName: "widgetName",
      version: 1,
      blueprint,
    }));

    const params = {
      parentId: "parentId",
      widgetId: "newWidgetId",
      type: "widgetType",
    };

    const widgets: Record<string, Partial<WidgetProps>> = {
      parentId: {
        widgetId: "parentId",
        widgetName: "parentWidget",
      },
      existingWidget: {
        widgetName: "widgetName",
        widgetId: "existingWidget",
      },
    };

    const expected = {
      parentId: {
        widgetId: "parentId",
        children: ["newWidgetId"],
        widgetName: "parentWidget",
      },
      newWidgetId: {
        someRandomProperty: "random",
        widgetName: "widgetName1",
        parentId: "parentId",
        widgetId: "newWidgetId",
        type: "widgetType",
        isOpen: true,
        version: 1,
        blueprint: undefined,
        rows: undefined,
        columns: undefined,
      },
      existingWidget: {
        widgetName: "widgetName",
        widgetId: "existingWidget",
      },
    };

    const result = await expectSaga(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateWidgetListWithNewWidget as any,
      params,
      widgets as CanvasWidgetsReduxState,
    )
      .provide([
        [select(getDataTree), { existingWidget: {}, parentWidget: {} }],
        [select(getLayoutSystemType), "ANVIL"],
      ])
      .run();

    expect(result.returnValue).toStrictEqual(expected);
  });
});
