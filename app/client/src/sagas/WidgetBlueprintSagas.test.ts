import WidgetFactory from "utils/WidgetFactory";

import {
  BlueprintOperation,
  executeWidgetBlueprintChildOperations,
} from "./WidgetBlueprintSagas";

export enum BlueprintOperationTypes {
  MODIFY_PROPS = "MODIFY_PROPS",
  ADD_ACTION = "ADD_ACTION",
  CHILD_OPERATIONS = "CHILD_OPERATIONS",
}

describe("executeWidgetBlueprintChildOperations", () => {
  it("should returns widgets after executing the child operation", async () => {
    const mockBlueprintChildOperation: BlueprintOperation = {
      type: BlueprintOperationTypes.CHILD_OPERATIONS,
      fn: () => {
        return { widgets: {} };
      },
    };

    jest
      .spyOn(WidgetFactory, "getWidgetDefaultPropertiesMap")
      .mockReturnValue({});

    const generator = executeWidgetBlueprintChildOperations(
      mockBlueprintChildOperation,
      {
        widgetId: {
          image: "",
          defaultImage: "",
          widgetId: "Widget1",
          type: "LIST_WIDGET",
          widgetName: "List1",
          parentId: "parentId",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          items: [],
          version: 16,
          settingsControlDisabled: false,
        },
      },
      "widgetId",
      "parentId",
    );

    expect(generator.next().value).toStrictEqual({});
  });
});
