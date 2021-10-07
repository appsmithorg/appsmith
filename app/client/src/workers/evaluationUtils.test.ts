import { getAllPaths } from "./evaluationUtils";
import { extractReferencesFromBinding } from "workers/DataTreeEvaluator";

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
});

describe("extractReferencesFromBinding", () => {
  it("works properly", () => {
    const allPaths: Record<string, true> = {
      Table1: true,
      "Table1.data": true,
    };

    const cases = [
      {
        script: "Table1.data.map(c => ({ name: c.name }))",
        expectedResults: ["Table1.data"],
      },
    ];

    cases.forEach((perCase) => {
      const references = extractReferencesFromBinding(perCase.script, allPaths);
      expect(references).toStrictEqual(perCase.expectedResults);
    });
  });
});
