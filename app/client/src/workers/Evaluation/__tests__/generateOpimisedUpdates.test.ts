import produce from "immer";
import { range } from "lodash";
import { generateOptimisedUpdates } from "../helpers";

export const smallDataSet = [
  {
    address: "Paseo de Soledad Tur 245 Puerta 4 \nValencia, 50285",
    company: "Gonzalez Inc",
  },
  {
    address: "Ronda Rosalina Menéndez 72\nCuenca, 38057",
    company: "Gallego, Pedrosa and Conesa",
  },
  {
    address: "833 جزيني Gateway\nمشفقland, AL 63852",
    company: "اهرام-الحويطات",
  },
];
//size of about 300 elements
const largeDataSet = range(100).flatMap(() => smallDataSet) as any;

const oldState = {
  Table1: {
    ENTITY_TYPE: "WIDGET",
    primaryColumns: {
      customColumn2: {
        isDisabled: false,
      },
    },
    tableData: [],
    filteredTableData: smallDataSet,
    selectedRows: [],
    pageSize: 0,
    triggerRowSelection: false,
    type: "TABLE_WIDGET_V2",
    __evaluation__: {
      errors: {
        transientTableData: [],
        tableData: [],
        processedTableData: [],
      },
      evaluatedValues: {
        filteredTableData: smallDataSet,
        transientTableData: {},
        tableData: [],
        processedTableData: [],
        "primaryColumns.customColumn2.isDisabled": false,
      },
    },
  },
  Select1: {
    value: "",
    ENTITY_TYPE: "WIDGET",
    options: [
      {
        label: "courtney68@example.net",
        value: 1,
      },
      {
        label: "osamusato@example.com",
        value: 2,
      },
    ],
    type: "SELECT_WIDGET",
    __evaluation__: {
      errors: {
        options: [],
      },
      evaluatedValues: {
        "meta.value": "",
        value: "",
      },
    },
  },
};

describe("optimised diff updates", () => {
  describe("regular diff", () => {
    test("should generate regular diff updates when a simple property changes in the widget property segment", () => {
      const newState = produce(oldState, (draft) => {
        draft.Table1.pageSize = 17;
      });
      const updates = generateOptimisedUpdates(oldState, newState);
      expect(updates).toEqual([
        { kind: "E", path: ["Table1", "pageSize"], lhs: 0, rhs: 17 },
      ]);
    });
    test("should generate regular diff updates when a simple property changes in the __evaluation__ segment ", () => {
      const validationError = "Some validation error";
      const newState = produce(oldState, (draft) => {
        draft.Table1.__evaluation__.evaluatedValues.tableData =
          validationError as any;
      });
      const updates = generateOptimisedUpdates(oldState, newState);
      expect(updates).toEqual([
        {
          kind: "E",
          path: ["Table1", "__evaluation__", "evaluatedValues", "tableData"],
          lhs: [],
          rhs: validationError,
        },
      ]);
    });
  });

  describe("diffs with identicalEvalPathsPatches", () => {
    test("should not generate any updates when both the states are the same", () => {
      const updates = generateOptimisedUpdates(oldState, oldState);
      expect(updates).toEqual([]);
      const identicalEvalPathsPatches = {
        "Table1.__evaluation__.evaluatedValues.['tableData']":
          "Table1.tableData",
      };
      const updatesWithCompressionMap = generateOptimisedUpdates(
        oldState,
        oldState,
        identicalEvalPathsPatches,
      );
      expect(updatesWithCompressionMap).toEqual([]);
    });
    test("should generate the correct table data updates and reference state patches", () => {
      const identicalEvalPathsPatches = {
        "Table1.__evaluation__.evaluatedValues.['tableData']":
          "Table1.tableData",
      };
      const newState = produce(oldState, (draft) => {
        draft.Table1.tableData = largeDataSet;
      });
      const updates = generateOptimisedUpdates(
        oldState,
        newState,
        identicalEvalPathsPatches,
      );
      expect(updates).toEqual([
        { kind: "N", path: ["Table1", "tableData"], rhs: largeDataSet },
        {
          kind: "referenceState",
          path: ["Table1", "__evaluation__", "evaluatedValues", "tableData"],
          referencePath: "Table1.tableData",
        },
      ]);
    });
    test("should not generate granular updates and generate a patch which replaces the complete collection when any change is made to the large collection ", () => {
      const largeDataSetWithSomeSimpleChange = produce(
        largeDataSet,
        (draft: any) => {
          //making a change to the first row of the collection
          draft[0].address = "some new address";
          //making a change to the second row of the collection
          draft[1].address = "some other new address";
        },
      ) as any;
      const identicalEvalPathsPatches = {
        "Table1.__evaluation__.evaluatedValues.['tableData']":
          "Table1.tableData",
      };
      const evalVal = "some eval value" as any;

      const newState = produce(oldState, (draft) => {
        //this value eval value should be ignores since we have provided identicalEvalPathsPatches which takes precedence
        draft.Table1.__evaluation__.evaluatedValues.tableData = evalVal as any;
        draft.Table1.tableData = largeDataSetWithSomeSimpleChange;
      });

      const updates = generateOptimisedUpdates(
        oldState,
        newState,
        identicalEvalPathsPatches,
      );
      //should not see evalVal since identical eval path patches takes precedence
      expect(JSON.stringify(updates)).not.toContain(evalVal);
      expect(updates).toEqual([
        {
          kind: "N",
          path: ["Table1", "tableData"],
          //we should not see granular updates but complete replacement
          rhs: largeDataSetWithSomeSimpleChange,
        },
        {
          //compression patch
          kind: "referenceState",
          path: ["Table1", "__evaluation__", "evaluatedValues", "tableData"],
          referencePath: "Table1.tableData",
        },
      ]);
    });
    test("should not generate compression patches when there are no identical eval paths provided ", () => {
      const tableDataEvaluationValue = "someValidation error";
      const largeDataSetWithSomeSimpleChange = produce(
        largeDataSet,
        (draft: any) => {
          //making a change to the first row of the collection
          draft[0].address = "some new address";
          //making a change to the second row of the collection
          draft[1].address = "some other new address";
        },
      ) as any;
      // empty indentical eval paths
      const identicalEvalPathsPatches = {};
      const newState = produce(oldState, (draft) => {
        draft.Table1.tableData = largeDataSetWithSomeSimpleChange;
        draft.Table1.__evaluation__.evaluatedValues.tableData =
          tableDataEvaluationValue as any;
      });
      const updates = generateOptimisedUpdates(
        oldState,
        newState,
        identicalEvalPathsPatches,
      );
      expect(updates).toEqual([
        {
          //considered as regular diff since there are no identical eval paths provided
          kind: "E",
          path: ["Table1", "__evaluation__", "evaluatedValues", "tableData"],
          lhs: [],
          rhs: tableDataEvaluationValue,
        },
        {
          kind: "N",
          path: ["Table1", "tableData"],
          //we should not see granular updates but complete replacement
          rhs: largeDataSetWithSomeSimpleChange,
        },
      ]);
    });
    test("should not generate any update when the new state has the same value as the old state", () => {
      const oldStateSetWithSomeData = produce(oldState, (draft) => {
        draft.Table1.tableData = largeDataSet;
        draft.Table1.__evaluation__.evaluatedValues.tableData = largeDataSet;
      });
      const identicalEvalPathsPatches = {
        "Table1.__evaluation__.evaluatedValues.['tableData']":
          "Table1.tableData",
      };
      const newStateSetWithTheSameData = produce(oldState, (draft) => {
        //deliberating making a new instance of largeDataSet
        draft.Table1.tableData = [...largeDataSet] as any;
      });
      //since the old state has the same value as the new value..we wont generate a patch unnecessarily...
      const updates = generateOptimisedUpdates(
        oldStateSetWithSomeData,
        newStateSetWithTheSameData,
        identicalEvalPathsPatches,
      );
      expect(updates).toEqual([]);
    });
  });
});
