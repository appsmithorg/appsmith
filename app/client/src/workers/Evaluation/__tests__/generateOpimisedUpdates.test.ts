/* eslint-disable @typescript-eslint/no-empty-function */
import { applyChange } from "deep-diff";
import produce from "immer";
import { klona } from "klona/full";
import { range } from "lodash";
import moment from "moment";
import { parseUpdatesAndDeleteUndefinedUpdates } from "sagas/EvaluationSaga.utils";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";

import {
  generateOptimisedUpdates,
  generateSerialisedUpdates,
} from "../helpers";

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

describe("generateOptimisedUpdates", () => {
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

//we are testing the flow of serialised updates generated from the worker thread and subsequently applied to the main thread state
describe("generateSerialisedUpdates and parseUpdatesAndDeleteUndefinedUpdates", () => {
  it("should ignore undefined updates", () => {
    const oldStateWithUndefinedValues = produce(oldState, (draft: any) => {
      draft.Table1.pageSize = undefined;
    });

    const { serialisedUpdates } = generateSerialisedUpdates(
      oldStateWithUndefinedValues,
      //new state has the same undefined value
      oldStateWithUndefinedValues,
      {},
    );
    //no change hence empty array
    expect(serialisedUpdates).toEqual("[]");
  });
  it("should generate a delete patch when a property is transformed to undefined", () => {
    const oldStateWithUndefinedValues = produce(oldState, (draft: any) => {
      draft.Table1.pageSize = undefined;
    });

    const { serialisedUpdates } = generateSerialisedUpdates(
      oldState,
      oldStateWithUndefinedValues,
      {},
    );
    const parsedUpdates =
      parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);
    expect(parsedUpdates).toEqual([
      {
        kind: "D",
        path: ["Table1", "pageSize"],
      },
    ]);
  });
  it("should generate an error when there is a serialisation error", () => {
    const oldStateWithUndefinedValues = produce(oldState, (draft: any) => {
      //generate a cyclical object
      draft.Table1.filteredTableData = draft.Table1;
    });
    const { error, serialisedUpdates } = generateSerialisedUpdates(
      oldState,
      oldStateWithUndefinedValues,
      {},
    );

    expect(error?.type).toEqual(EvalErrorTypes.SERIALIZATION_ERROR);
    //when a serialisation error occurs we should not return an error
    expect(serialisedUpdates).toEqual("[]");
  });
  //when functions are serialised they become undefined and these updates should be deleted from the state
  describe("clean out all functions in the generated state", () => {
    it("should clean out new function properties added to the generated state", () => {
      const newStateWithSomeFnProperty = produce(oldState, (draft: any) => {
        draft.Table1.someFn = () => {};
        draft.Table1.__evaluation__.evaluatedValues.someEvalFn = () => {};
      });

      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        newStateWithSomeFnProperty,
        {},
      );

      const parsedUpdates =
        parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);
      //should ignore all function updates
      expect(parsedUpdates).toEqual([]);

      const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
        parsedUpdates.forEach((v: any) => {
          applyChange(draft, undefined, v);
        });
      });
      //no change in state
      expect(parseAndApplyUpdatesToOldState).toEqual(oldState);
    });

    it("should delete properties which get updated to a function", () => {
      const newStateWithSomeFnProperty = produce(oldState, (draft: any) => {
        draft.Table1.pageSize = () => {};
        draft.Table1.__evaluation__.evaluatedValues.transientTableData =
          () => {};
      });

      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        newStateWithSomeFnProperty,
        {},
      );

      const parsedUpdates =
        parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

      expect(parsedUpdates).toEqual([
        {
          kind: "D",
          path: ["Table1", "pageSize"],
        },
        {
          kind: "D",
          path: [
            "Table1",
            "__evaluation__",
            "evaluatedValues",
            "transientTableData",
          ],
        },
      ]);

      const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
        parsedUpdates.forEach((v: any) => {
          applyChange(draft, undefined, v);
        });
      });
      const expectedState = produce(oldState, (draft: any) => {
        delete draft.Table1.pageSize;
        delete draft.Table1.__evaluation__.evaluatedValues.transientTableData;
      });

      expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
    });
    it("should delete function properties which get updated to undefined", () => {
      const oldStateWithSomeFnProperty = produce(oldState, (draft: any) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        draft.Table1.pageSize = () => {};
        draft.Table1.__evaluation__.evaluatedValues.transientTableData =
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {};
      });
      const newStateWithFnsTransformedToUndefined = produce(
        oldState,
        (draft: any) => {
          draft.Table1.pageSize = undefined;
          draft.Table1.__evaluation__.evaluatedValues.transientTableData =
            undefined;
        },
      );

      const { serialisedUpdates } = generateSerialisedUpdates(
        oldStateWithSomeFnProperty,
        newStateWithFnsTransformedToUndefined,
        {},
      );

      const parsedUpdates =
        parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

      expect(parsedUpdates).toEqual([
        {
          kind: "D",
          path: ["Table1", "pageSize"],
        },
        {
          kind: "D",
          path: [
            "Table1",
            "__evaluation__",
            "evaluatedValues",
            "transientTableData",
          ],
        },
      ]);

      const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
        parsedUpdates.forEach((v: any) => {
          applyChange(draft, undefined, v);
        });
      });
      const expectedState = produce(oldState, (draft: any) => {
        delete draft.Table1.pageSize;
        delete draft.Table1.__evaluation__.evaluatedValues.transientTableData;
      });

      expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
    });
  });

  it("should serialise bigInteger values", () => {
    const someBigInt = BigInt(121221);
    const newStateWithBigInt = produce(oldState, (draft: any) => {
      draft.Table1.pageSize = someBigInt;
    });
    const { serialisedUpdates } = generateSerialisedUpdates(
      oldState,
      newStateWithBigInt,
      {},
    );

    const parsedUpdates =
      parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

    //should generate serialised bigInt update
    expect(parsedUpdates).toEqual([
      {
        kind: "E",
        path: ["Table1", "pageSize"],
        rhs: "121221",
      },
    ]);

    const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
      parsedUpdates.forEach((v: any) => {
        applyChange(draft, undefined, v);
      });
    });
    const expectedState = produce(oldState, (draft: any) => {
      draft.Table1.pageSize = "121221";
    });

    expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
  });
  describe("serialise momement updates directly", () => {
    test("should generate a null update when it sees an invalid moment object", () => {
      const newState = produce(oldState, (draft) => {
        draft.Table1.pageSize = moment("invalid value") as any;
      });
      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        newState,
        {},
      );
      const serialisedExpectedOutput = JSON.stringify([
        { kind: "E", rhs: null, path: ["Table1", "pageSize"] },
      ]);
      expect(serialisedUpdates).toEqual(serialisedExpectedOutput);
    });
    test("should generate a regular update when it sees a valid moment object", () => {
      const validMoment = moment();
      const newState = produce(oldState, (draft) => {
        draft.Table1.pageSize = validMoment as any;
      });
      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        newState,
        {},
      );
      const serialisedExpectedOutput = JSON.stringify([
        { kind: "E", rhs: validMoment, path: ["Table1", "pageSize"] },
      ]);
      expect(serialisedUpdates).toEqual(serialisedExpectedOutput);
    });
  });
  // we are testing a flow from worker thread diff updates to being applied to the main thread's state
  describe("test main thread update flow", () => {
    //this function takes in serialised updates from the webworker and applies it to the main thread's state
    function generateMainThreadStateFromSerialisedUpdates(
      serialisedUpdates: any,
      prevState: any,
    ) {
      const parsedUpdates =
        parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);
      return produce(prevState, (draft: any) => {
        parsedUpdates.forEach((v: any) => {
          applyChange(draft, undefined, v);
        });
      });
    }
    let workerStateWithCollection: any;
    let mainThreadStateWithCollection: any;
    const someDate = "2023-12-07T19:05:11.830Z";
    test("large moment collection updates should be serialised, we should always see ISO string and no moment object properties", () => {
      const largeCollection = [] as any;
      for (let i = 0; i < 110; i++) {
        largeCollection.push({ i, c: moment(someDate) });
      }
      //attaching a collection to some property in the workerState
      workerStateWithCollection = produce(oldState, (draft) => {
        draft.Table1.pageSize = largeCollection as any;
      });
      //generate serialised diff updates
      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        workerStateWithCollection,
        {},
      );
      // parsing the updates generated by worker and applying it back to the main threadState
      mainThreadStateWithCollection =
        generateMainThreadStateFromSerialisedUpdates(
          serialisedUpdates,
          oldState,
        );

      const expectedMainThreadState = produce(oldState, (draft) => {
        draft.Table1.pageSize = JSON.parse(
          JSON.stringify(largeCollection),
        ) as any;
      });
      //check first value has the correct date
      expect(mainThreadStateWithCollection.Table1.pageSize[0].c).toEqual(
        someDate,
      );

      expect(mainThreadStateWithCollection).toEqual(expectedMainThreadState);
    });
    test("update in a single moment value in a collection should always be serialised ", () => {
      const someNewDate = "2023-12-07T19:05:11.930Z";
      // updating a single value in the prev worker state
      const updatedWorkerStateWithASingleValue = produce(
        klona(workerStateWithCollection),
        (draft: any) => {
          draft.Table1.pageSize[0].c = moment(someNewDate) as any;
        },
      );

      //generate serialised diff updates
      const { serialisedUpdates } = generateSerialisedUpdates(
        workerStateWithCollection,
        updatedWorkerStateWithASingleValue,
        {},
      );

      // parsing the updates generated by worker and applying it back to the main threadState
      const updatedMainThreadState =
        generateMainThreadStateFromSerialisedUpdates(
          serialisedUpdates,
          mainThreadStateWithCollection,
        ) as any;
      // check if the main thread state has the updated value
      expect(updatedMainThreadState.Table1.pageSize[0].c).toEqual(someNewDate);

      const expectedMainThreadState = produce(
        mainThreadStateWithCollection,
        (draft: any) => {
          draft.Table1.pageSize[0].c = JSON.parse(
            JSON.stringify(moment(someNewDate)),
          ) as any;
        },
      );

      expect(updatedMainThreadState).toEqual(expectedMainThreadState);
    });
    test("update in a single moment value to an invalid value should always be serialised ", () => {
      //some garbage value
      const someNewDate = "fdfdfd";
      // updating a single value in the prev worker state
      const updatedWorkerStateWithASingleValue = produce(
        klona(workerStateWithCollection),
        (draft: any) => {
          draft.Table1.pageSize[0].c = moment(someNewDate) as any;
        },
      );

      //generate serialised diff updates
      const { serialisedUpdates } = generateSerialisedUpdates(
        workerStateWithCollection,
        updatedWorkerStateWithASingleValue,
        {},
      );

      // parsing the updates generated by worker and applying it back to the main threadState
      const updatedMainThreadState =
        generateMainThreadStateFromSerialisedUpdates(
          serialisedUpdates,
          mainThreadStateWithCollection,
        ) as any;
      // check if the main thread state has the updated invalid value which should be null
      expect(updatedMainThreadState.Table1.pageSize[0].c).toEqual(null);

      const expectedMainThreadState = produce(
        mainThreadStateWithCollection,
        (draft: any) => {
          draft.Table1.pageSize[0].c = JSON.parse(
            JSON.stringify(moment(someNewDate)),
          ) as any;
        },
      );

      expect(updatedMainThreadState).toEqual(expectedMainThreadState);
    });
  });
});
