import type { WidgetEntity } from "ee/entities/DataTree/types";
import { applyChange } from "deep-diff";
import produce from "immer";
import { klona } from "klona/full";
import { range } from "lodash";
import moment from "moment";
import { parseUpdatesAndDeleteUndefinedUpdates } from "sagas/EvaluationsSagaUtils";
import type {
  DataTreeEvaluationProps,
  EvaluationError,
} from "utils/DynamicBindingUtils";
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
const largeDataSet = range(100).flatMap(() => smallDataSet);

// In the oldState we have provided evaluationProps so we have created a type which states that the entity always has it
//  and __evaluation__.errors is not optional. So we don't have to keep adding truthy checks when accessing the evaluationProps in this test case.
interface dataTreeWithWidget {
  [entityName: string]: WidgetEntity & Required<DataTreeEvaluationProps>;
}

const oldState: dataTreeWithWidget = {
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
    },
    meta: {},
    widgetId: "232",
    widgetName: "Table",
    renderMode: "PAGE",
    version: 1,
    parentColumnSpace: 121,
    parentRowSpace: 123,
    leftColumn: 123,
    rightColumn: 123,
    topRow: 0,
    bottomRow: 0,
    isLoading: false,
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
    },
    meta: {},
    widgetId: "232",
    widgetName: "Table",
    renderMode: "PAGE",
    version: 1,
    parentColumnSpace: 121,
    parentRowSpace: 123,
    leftColumn: 123,
    rightColumn: 123,
    topRow: 0,
    bottomRow: 0,
    isLoading: false,
  },
};

describe("generateOptimisedUpdates", () => {
  describe("regular diff", () => {
    test("should not generate any diff when the constrainedDiffPaths is empty", () => {
      const newState = produce(oldState, (draft) => {
        draft.Table1.pageSize = 17;
      });
      const updates = generateOptimisedUpdates(oldState, newState, []);

      // no diff should be generated
      expect(updates).toEqual([]);
    });
    test("should not generate any diff when the constrainedDiffPaths nodes are the same ", () => {
      const newState = produce(oldState, (draft) => {
        //making an unrelated change
        draft.Table1.triggerRowSelection = true;
      });
      const updates = generateOptimisedUpdates(oldState, newState, [
        "Table1.pageSize",
      ]);

      // no diff should be generated and the the unrealted change should be ignored
      expect(updates).toEqual([]);
    });
    test("should generate regular diff updates when a simple property changes in the widget property segment", () => {
      const newState = produce(oldState, (draft) => {
        draft.Table1.pageSize = 17;
      });
      const updates = generateOptimisedUpdates(oldState, newState, [
        "Table1.pageSize",
      ]);

      expect(updates).toEqual([
        { kind: "E", path: ["Table1", "pageSize"], lhs: 0, rhs: 17 },
      ]);
    });
    test("should generate regular diff updates when a simple property changes in the __evaluation__ segment ", () => {
      const validationError =
        "Some validation error" as unknown as EvaluationError[];
      const newState = produce(oldState, (draft) => {
        draft.Table1.__evaluation__.errors.tableData = validationError;
      });
      const updates = generateOptimisedUpdates(oldState, newState, [
        "Table1.__evaluation__.errors.tableData",
      ]);

      expect(updates).toEqual([
        {
          kind: "E",
          path: ["Table1", "__evaluation__", "errors", "tableData"],
          lhs: [],
          rhs: validationError,
        },
      ]);
    });
    test("should generate a replace collection patch when the size of the collection exceeds 100 instead of generating granular updates", () => {
      const newState = produce(oldState, (draft) => {
        draft.Table1.tableData = largeDataSet;
      });
      const updates = generateOptimisedUpdates(oldState, newState, [
        "Table1.tableData",
      ]);

      expect(updates).toEqual([
        {
          kind: "N",
          path: ["Table1", "tableData"],
          rhs: largeDataSet,
        },
      ]);
    });
    describe("undefined value updates in a collection", () => {
      test("should generate replace patch when a single node is set to undefined in a collection", () => {
        const statWithLargeCollection = produce(oldState, (draft) => {
          draft.Table1.tableData = ["a", "b"];
        });
        const newStateWithAnElementDeleted = produce(
          statWithLargeCollection,
          (draft) => {
            draft.Table1.tableData = ["a", undefined];
          },
        );
        const updates = generateOptimisedUpdates(
          statWithLargeCollection,
          newStateWithAnElementDeleted,
          ["Table1.tableData[1]"],
        );

        expect(updates).toEqual([
          {
            kind: "E",
            lhs: ["a", "b"],
            path: ["Table1", "tableData"],
            rhs: ["a", undefined],
          },
        ]);
      });
      test("should generate generate regular diff updates for non undefined updates in a collection", () => {
        const statWithLargeCollection = produce(oldState, (draft) => {
          draft.Table1.tableData = ["a", "b"];
        });
        const newStateWithAnElementDeleted = produce(
          statWithLargeCollection,
          (draft) => {
            draft.Table1.tableData = ["a", "e"];
          },
        );
        const updates = generateOptimisedUpdates(
          statWithLargeCollection,
          newStateWithAnElementDeleted,
          ["Table1.tableData[1]"],
        );

        expect(updates).toEqual([
          { kind: "E", path: ["Table1", "tableData", 1], lhs: "b", rhs: "e" },
        ]);
      });
    });
  });

  //we are testing the flow of serialised updates generated from the worker thread and subsequently applied to the main thread state
  describe("generateSerialisedUpdates and parseUpdatesAndDeleteUndefinedUpdates", () => {
    const additionalUpdates = [
      { kind: "E", path: ["Table1", "pageSize"], lhs: 0, rhs: 17 },
    ];

    it("should merge additional updates with existing updates", () => {
      const { serialisedUpdates } = generateSerialisedUpdates(
        {},
        {},
        [],
        additionalUpdates,
      );

      // we should only see additional updates
      expect(serialisedUpdates).toEqual(JSON.stringify(additionalUpdates));
    });
    it("should ignore undefined updates", () => {
      const oldStateWithUndefinedValues = produce(oldState, (draft) => {
        draft.Table1.pageSize = undefined;
      });

      const { serialisedUpdates } = generateSerialisedUpdates(
        oldStateWithUndefinedValues,
        //new state has the same undefined value
        oldStateWithUndefinedValues,
        ["Table1.pageSize"],
        additionalUpdates,
      );

      //no change hence empty array
      expect(serialisedUpdates).toEqual(JSON.stringify(additionalUpdates));
    });
    it("should generate a delete patch when a property is transformed to undefined", () => {
      const oldStateWithUndefinedValues = produce(oldState, (draft) => {
        draft.Table1.pageSize = undefined;
      });

      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        oldStateWithUndefinedValues,
        ["Table1.pageSize"],
        [],
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
      const oldStateWithUndefinedValues = produce(oldState, (draft) => {
        //generate a cyclical object
        draft.Table1.filteredTableData = draft.Table1;
      });
      const { error, serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        oldStateWithUndefinedValues,
        ["Table1.filteredTableData"],
        [],
      );

      expect(error?.type).toEqual(EvalErrorTypes.SERIALIZATION_ERROR);
      //when a serialisation error occurs we should not return an error
      expect(serialisedUpdates).toEqual("[]");
    });

    //when functions are serialised they become undefined and these updates should be deleted from the state
    describe("clean out all functions in the generated state", () => {
      const someEvalFn = (() => {}) as unknown as EvaluationError[];

      it("should clean out new function properties added to the generated state", () => {
        const newStateWithSomeFnProperty = produce(oldState, (draft) => {
          draft.Table1.someFn = () => {};
          draft.Table1.__evaluation__.errors.someEvalFn = someEvalFn;
        });

        const { serialisedUpdates } = generateSerialisedUpdates(
          oldState,
          newStateWithSomeFnProperty,
          ["Table1.someFn", "Table1.__evaluation__.errors.someEvalFn"],
          [],
        );

        const parsedUpdates =
          parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

        //should delete all function updates
        expect(parsedUpdates).toEqual([]);

        const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedUpdates.forEach((v: any) => {
            applyChange(draft, undefined, v);
          });
        });

        //no change in state
        expect(parseAndApplyUpdatesToOldState).toEqual(oldState);
      });

      it("should delete properties which get updated to a function", () => {
        const newStateWithSomeFnProperty = produce(oldState, (draft) => {
          draft.Table1.pageSize = () => {};
          draft.Table1.__evaluation__.errors.transientTableData = someEvalFn;
        });

        const { serialisedUpdates } = generateSerialisedUpdates(
          oldState,
          newStateWithSomeFnProperty,
          [
            "Table1.pageSize",
            "Table1.__evaluation__.errors.transientTableData",
          ],
          [],
        );

        const parsedUpdates =
          parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

        expect(parsedUpdates).toEqual([
          {
            kind: "D",
            path: ["Table1", "__evaluation__", "errors", "transientTableData"],
          },
          {
            kind: "D",
            path: ["Table1", "pageSize"],
          },
        ]);

        const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedUpdates.forEach((v: any) => {
            applyChange(draft, undefined, v);
          });
        });
        const expectedState = produce(oldState, (draft) => {
          delete draft.Table1.pageSize;
          delete draft.Table1.__evaluation__.errors.transientTableData;
        });

        expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
      });
      it("should delete function properties which get updated to undefined", () => {
        const oldStateWithSomeFnProperty = produce(oldState, (draft) => {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          draft.Table1.pageSize = () => {};
          draft.Table1.__evaluation__.errors.transientTableData =
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            someEvalFn;
        });
        const newStateWithFnsTransformedToUndefined = produce(
          oldState,
          (draft) => {
            draft.Table1.pageSize = undefined;
            draft.Table1.__evaluation__.errors.transientTableData =
              undefined as unknown as EvaluationError[];
          },
        );

        const { serialisedUpdates } = generateSerialisedUpdates(
          oldStateWithSomeFnProperty,
          newStateWithFnsTransformedToUndefined,
          [
            "Table1.pageSize",
            "Table1.__evaluation__.errors.transientTableData",
          ],
          [],
        );

        const parsedUpdates =
          parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

        expect(parsedUpdates).toEqual([
          {
            kind: "D",
            path: ["Table1", "__evaluation__", "errors", "transientTableData"],
          },
          {
            kind: "D",
            path: ["Table1", "pageSize"],
          },
        ]);

        const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedUpdates.forEach((v: any) => {
            applyChange(draft, undefined, v);
          });
        });
        const expectedState = produce(oldState, (draft) => {
          delete draft.Table1.pageSize;
          delete draft.Table1.__evaluation__.errors.transientTableData;
        });

        expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
      });
    });

    it("should serialise bigInteger values", () => {
      const someBigInt = BigInt(121221);
      // should generate serialised bigInt updates in additionalUpdates
      const someAdditionaTableUpdates = [
        {
          kind: "N",
          path: ["Table1", "someNewProp"],
          rhs: { someOtherKey: BigInt(3323232) },
        },
      ];
      const newStateWithBigInt = produce(oldState, (draft) => {
        draft.Table1.pageSize = someBigInt;
      });
      const { serialisedUpdates } = generateSerialisedUpdates(
        oldState,
        newStateWithBigInt,
        ["Table1.pageSize"],
        someAdditionaTableUpdates,
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
        {
          kind: "N",
          path: ["Table1", "someNewProp"],
          rhs: {
            someOtherKey: "3323232",
          },
        },
      ]);

      const parseAndApplyUpdatesToOldState = produce(oldState, (draft) => {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parsedUpdates.forEach((v: any) => {
          applyChange(draft, undefined, v);
        });
      });
      const expectedState = produce(oldState, (draft) => {
        draft.Table1.pageSize = "121221";
        draft.Table1.someNewProp = { someOtherKey: "3323232" };
      });

      expect(parseAndApplyUpdatesToOldState).toEqual(expectedState);
    });
    describe("serialise momement updates directly", () => {
      test("should generate a null update when it sees an invalid moment object", () => {
        const newState = produce(oldState, (draft) => {
          draft.Table1.pageSize = moment("invalid value");
        });
        const { serialisedUpdates } = generateSerialisedUpdates(
          oldState,
          newState,
          ["Table1.pageSize"],
        );
        const serialisedExpectedOutput = JSON.stringify([
          { kind: "E", rhs: null, path: ["Table1", "pageSize"] },
        ]);

        expect(serialisedUpdates).toEqual(serialisedExpectedOutput);
      });
      test("should generate a regular update when it sees a valid moment object", () => {
        const validMoment = moment();
        const newState = produce(oldState, (draft) => {
          draft.Table1.pageSize = validMoment;
        });
        const { serialisedUpdates } = generateSerialisedUpdates(
          oldState,
          newState,
          ["Table1.pageSize"],
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
        serialisedUpdates: string,
        prevState: dataTreeWithWidget,
      ) {
        const parsedUpdates =
          parseUpdatesAndDeleteUndefinedUpdates(serialisedUpdates);

        return produce(prevState, (draft) => {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedUpdates.forEach((v: any) => {
            applyChange(draft, undefined, v);
          });
        });
      }

      let workerStateWithCollection: dataTreeWithWidget;
      let mainThreadStateWithCollection: dataTreeWithWidget;
      const someDate = "2023-12-07T19:05:11.830Z";

      test("large moment collection updates should be serialised, we should always see ISO string and no moment object properties", () => {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const largeCollection = [] as any;

        for (let i = 0; i < 110; i++) {
          largeCollection.push({ i, c: moment(someDate) });
        }

        //attaching a collection to some property in the workerState
        workerStateWithCollection = produce(oldState, (draft) => {
          draft.Table1.pageSize = largeCollection;
        });
        //generate serialised diff updates
        const { serialisedUpdates } = generateSerialisedUpdates(
          oldState,
          workerStateWithCollection,
          ["Table1.pageSize"],
        );

        // parsing the updates generated by worker and applying it back to the main threadState
        mainThreadStateWithCollection =
          generateMainThreadStateFromSerialisedUpdates(
            serialisedUpdates,
            oldState,
          );

        const expectedMainThreadState = produce(oldState, (draft) => {
          draft.Table1.pageSize = JSON.parse(JSON.stringify(largeCollection));
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
          (draft) => {
            draft.Table1.pageSize[0].c = moment(someNewDate);
          },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;

        //generate serialised diff updates
        const { serialisedUpdates } = generateSerialisedUpdates(
          workerStateWithCollection,
          updatedWorkerStateWithASingleValue,
          ["Table1.pageSize[0].c"],
        );

        // parsing the updates generated by worker and applying it back to the main threadState
        const updatedMainThreadState =
          generateMainThreadStateFromSerialisedUpdates(
            serialisedUpdates,
            mainThreadStateWithCollection,
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any;

        // check if the main thread state has the updated value
        expect(updatedMainThreadState.Table1.pageSize[0].c).toEqual(
          someNewDate,
        );

        const expectedMainThreadState = produce(
          mainThreadStateWithCollection,
          (draft) => {
            draft.Table1.pageSize[0].c = JSON.parse(
              JSON.stringify(moment(someNewDate)),
            );
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
          (draft) => {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            draft.Table1.pageSize[0].c = moment(someNewDate) as any;
          },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;

        //generate serialised diff updates
        const { serialisedUpdates } = generateSerialisedUpdates(
          workerStateWithCollection,
          updatedWorkerStateWithASingleValue,
          ["Table1.pageSize[0].c"],
        );

        // parsing the updates generated by worker and applying it back to the main threadState
        const updatedMainThreadState =
          generateMainThreadStateFromSerialisedUpdates(
            serialisedUpdates,
            mainThreadStateWithCollection,
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any;

        // check if the main thread state has the updated invalid value which should be null
        expect(updatedMainThreadState.Table1.pageSize[0].c).toEqual(null);

        const expectedMainThreadState = produce(
          mainThreadStateWithCollection,
          (draft) => {
            draft.Table1.pageSize[0].c = JSON.parse(
              JSON.stringify(moment(someNewDate)),
            );
          },
        );

        expect(updatedMainThreadState).toEqual(expectedMainThreadState);
      });
    });
  });
});
