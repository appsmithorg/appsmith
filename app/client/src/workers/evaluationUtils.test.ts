import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import { getAllPaths, isPrivateEntityPath } from "./evaluationUtils";

describe("Correctly handle paths", () => {
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

  it("correctly checks if path is a PrivateEntityPath", () => {
    const privateWidgets: PrivateWidgets = {
      Button1: true,
      Image1: true,
      Button2: true,
      Image2: true,
    };

    expect(
      isPrivateEntityPath(privateWidgets, "List1.template.Button1.text"),
    ).toBeFalsy();
    expect(isPrivateEntityPath(privateWidgets, "Button1.text")).toBeTruthy();
    expect(
      isPrivateEntityPath(privateWidgets, "List2.template.Image2.data"),
    ).toBeFalsy();
    expect(isPrivateEntityPath(privateWidgets, "Image2.data")).toBeTruthy();
  });
});
