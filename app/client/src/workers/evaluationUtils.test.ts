import { DependencyMap } from "utils/DynamicBindingUtils";
import { getAllPaths, makeParentsDependOnChildren } from "./evaluationUtils";

describe("getAllPaths", () => {
  it("getsAllPaths", () => {
    const myTree = {
      WidgetName: {
        1: "yo",
        name: "WidgetName",
        objectProperty: {
          childObjectProperty: [
            "1",
            1,
            {
              key: "value",
              2: 1,
            },
            ["1", "2"],
          ],
        },
      },
    };
    const result = {
      WidgetName: true,
      "WidgetName.1": true,
      "WidgetName.name": true,
      "WidgetName.objectProperty": true,
      "WidgetName.objectProperty.childObjectProperty": true,
      "WidgetName.objectProperty.childObjectProperty[0]": true,
      "WidgetName.objectProperty.childObjectProperty[1]": true,
      "WidgetName.objectProperty.childObjectProperty[2]": true,
      "WidgetName.objectProperty.childObjectProperty[2].key": true,
      "WidgetName.objectProperty.childObjectProperty[2].2": true,
      "WidgetName.objectProperty.childObjectProperty[3]": true,
      "WidgetName.objectProperty.childObjectProperty[3][0]": true,
      "WidgetName.objectProperty.childObjectProperty[3][1]": true,
    };

    const actual = getAllPaths(myTree);
    expect(actual).toStrictEqual(result);
  });
  describe("makeParentsDependOnChildren", () => {
    it("makes parent properties depend on child properties", () => {
      let depMap: DependencyMap = {
        Widget1: [],
        "Widget1.defaultText": [],
      };
      const allkeys: Record<string, true> = {
        Widget1: true,
        "Widget1.defaultText": true,
      };
      depMap = makeParentsDependOnChildren(depMap, allkeys);
      expect(depMap).toStrictEqual({
        Widget1: ["Widget1.defaultText"],
        "Widget1.defaultText": [],
      });
    });

    it("doesn't make parent properties depend on child properties when not listed in allKeys", () => {
      let depMap: DependencyMap = {
        Widget1: [],
        "Widget1.defaultText": [],
      };
      const allkeys: Record<string, true> = {
        Widget1: true,
      };
      depMap = makeParentsDependOnChildren(depMap, allkeys);
      expect(depMap).toStrictEqual({
        Widget1: [],
        "Widget1.defaultText": [],
      });
    });
  });
});
