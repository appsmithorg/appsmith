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
      "Table1.data.details": true,
      "Table1.isVisible": true,
      Api1: true,
      "Api1.data": true,
      Api2: true,
      "Api2.data": true,
      "JSObject1.run": true,
    };

    const cases: { script: string; expectedResults: string[] }[] = [
      {
        // Entity reference
        script: "Table1",
        expectedResults: ["Table1"],
      },
      {
        // One level nesting
        script: "Table1.data",
        expectedResults: ["Table1.data"],
      },
      {
        // Deep nesting
        script: "Table1.data.details",
        expectedResults: ["Table1.data.details"],
      },
      {
        // Basic map function
        script: "Table1.data.map(c => ({ name: c.name }))",
        expectedResults: ["Table1.data"],
      },
      {
        // Index literal search
        script: "Table1['data']",
        expectedResults: ["Table1.data"],
      },
      {
        // Index literal identifier search
        script: "Table1.data[row]",
        expectedResults: ["Table1.data"],
      },
      {
        // Index literal with further nested lookups
        script: "Table1.data[row].name",
        expectedResults: ["Table1.data"],
      },
      {
        // IIFE and if conditions
        script:
          "(function(){ if(Table1.isVisible) { return Api1.data } else { return Api2.data } })()",
        expectedResults: ["Table1.isVisible", "Api1.data"],
      },
      {
        // Functions and arguments
        script: "JSObject1.run(Api1.data, Api2.data)",
        expectedResults: ["JSObject1.run", "Api1.data", "Api2.data"],
      },
      {
        // anonymous function with variables
        script: `() => {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table1.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table1.data"],
      },
      {
        // function with variables
        script: `function() {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table1.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table1.data"],
      },
    ];

    cases.forEach((perCase) => {
      const references = extractReferencesFromBinding(perCase.script, allPaths);
      expect(references).toStrictEqual(perCase.expectedResults);
    });
  });
});
