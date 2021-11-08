import { extractIdentifiersFromCode } from "workers/ast";

describe("getAllIdentifiers", () => {
  it("works properly", () => {
    const cases: { script: string; expectedResults: string[] }[] = [
      {
        // Entity reference
        script: "DirectTableReference",
        expectedResults: ["DirectTableReference"],
      },
      {
        // One level nesting
        script: "TableDataReference.data",
        expectedResults: ["TableDataReference.data"],
      },
      {
        // Deep nesting
        script: "TableDataDetailsReference.data.details",
        expectedResults: ["TableDataDetailsReference.data.details"],
      },
      {
        // Deep nesting
        script: "TableDataDetailsMoreReference.data.details.more",
        expectedResults: ["TableDataDetailsMoreReference.data.details.more"],
      },
      {
        // Deep optional chaining
        script: "TableDataOptionalReference.data?.details.more",
        expectedResults: ["TableDataOptionalReference.data"],
      },
      {
        // Deep optional chaining with logical operator
        script:
          "TableDataOptionalWithLogical.data?.details.more || FallbackTableData.data",
        expectedResults: [
          "TableDataOptionalWithLogical.data",
          "FallbackTableData.data",
        ],
      },
      {
        // null coalescing
        script: "TableDataOptionalWithLogical.data ?? FallbackTableData.data",
        expectedResults: [
          "TableDataOptionalWithLogical.data",
          "FallbackTableData.data",
        ],
      },
      {
        // Basic map function
        script: "Table5.data.map(c => ({ name: c.name }))",
        expectedResults: ["Table5.data.map", "c.name"],
      },
      {
        // Index literal property search
        script: "Table6['data']",
        expectedResults: ["Table6"],
      },
      {
        // Index literal array search
        script: "Table7.data[4]",
        expectedResults: ["Table7.data"],
      },
      {
        // Index identifier search
        script: "Table8.data[row][name]",
        expectedResults: ["Table8.data", "row", "name"],
      },
      {
        // Index identifier search with global
        script: "Table9.data[appsmith.store.row]",
        expectedResults: ["Table9.data", "appsmith.store.row"],
      },
      {
        // Index literal with further nested lookups
        script: "Table10.data[row].name",
        expectedResults: ["Table10.data", "row"],
      },
      {
        // IIFE and if conditions
        script:
          "(function(){ if(Table11.isVisible) { return Api1.data } else { return Api2.data } })()",
        expectedResults: ["Table11.isVisible", "Api1.data", "Api2.data"],
      },
      {
        // Functions and arguments
        script: "JSObject1.run(Api1.data, Api2.data)",
        expectedResults: ["JSObject1.run", "Api1.data", "Api2.data"],
      },
      {
        // Function declaration and default arguments
        script: `function run(data = Api1.data) {
          return data;
        }`,
        expectedResults: ["Api1.data"],
      },
      {
        // Function declaration with arguments
        script: `function run(data) {
          return data;
        }`,
        expectedResults: [],
      },
      {
        // anonymous function with variables
        script: `() => {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table12.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table12.data"],
      },
      {
        // function with variables
        script: `function myFunction() {
          let row = 0;
          const data = {};
          while(row < 10) {
            data["test__" + row] = Table13.data[row];
            row = row += 1;
          }
        }`,
        expectedResults: ["Table13.data"],
      },
      {
        // expression with arithmetic operations
        script: `Table14.data + 15`,
        expectedResults: ["Table14.data"],
      },
      {
        // expression with logical operations
        script: `Table15.data || [{}]`,
        expectedResults: ["Table15.data"],
      },
    ];

    cases.forEach((perCase) => {
      const references = extractIdentifiersFromCode(perCase.script);
      expect(references).toStrictEqual(perCase.expectedResults);
    });
  });
});
