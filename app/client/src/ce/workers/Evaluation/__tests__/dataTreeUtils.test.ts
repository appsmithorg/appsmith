import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { makeEntityConfigsAsObjProperties } from "@appsmith/workers/Evaluation/dataTreeUtils";
import { smallDataSet } from "workers/Evaluation/__tests__/generateOpimisedUpdates.test";
import produce from "immer";
import { cloneDeep } from "lodash";

const unevalTreeFromMainThread = {
  Api2: {
    actionId: "6380b1003a20d922b774eb75",
    run: {},
    clear: {},
    isLoading: false,
    responseMeta: {
      isExecutionSuccess: false,
    },
    config: {},
    ENTITY_TYPE: "ACTION",
    datasourceUrl: "https://www.facebook.com",
  },
  JSObject1: {
    actionId: "637cda3b2f8e175c6f5269d5",
    newFunction: {
      data: {},
    },
    storeTest2: {
      data: {},
    },
    body: "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
    ENTITY_TYPE: "JSACTION",
  },
  MainContainer: {
    ENTITY_TYPE: "WIDGET",
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 1224,
    snapColumns: 64,
    widgetId: "0",
    topRow: 0,
    bottomRow: 1240,
    containerStyle: "none",
    snapRows: 124,
    parentRowSpace: 1,
    canExtend: true,
    minHeight: 1250,
    parentColumnSpace: 1,
    leftColumn: 0,
    meta: {},
    type: "CANVAS_WIDGET",
  },
  Button2: {
    ENTITY_TYPE: "WIDGET",
    resetFormOnClick: false,
    boxShadow: "none",
    widgetName: "Button2",
    buttonColor: "{{appsmith.theme.colors.primaryColor}}",
    topRow: 3,
    bottomRow: 7,
    parentRowSpace: 10,
    animateLoading: true,
    parentColumnSpace: 34.5,
    leftColumn: 31,
    text: "test",
    isDisabled: false,
    key: "oypcoe6gx4",
    rightColumn: 47,
    isDefaultClickDisabled: true,
    widgetId: "vxpz4ta27g",
    isVisible: true,
    recaptchaType: "V3",
    isLoading: false,
    disabledWhenInvalid: false,
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    buttonVariant: "PRIMARY",
    placement: "CENTER",
    meta: {},
    type: "BUTTON_WIDGET",
  },
  appsmith: {
    user: {
      email: "someuser@appsmith.com",
      username: "someuser@appsmith.com",
      name: "Some name",
      enableTelemetry: true,
      emptyInstance: false,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      isAnonymous: false,
      isEnabled: true,
      isSuperUser: false,
      isConfigurable: true,
    },
    URL: {
      fullPath: "",
      host: "dev.appsmith.com",
      hostname: "dev.appsmith.com",
      queryParams: {},
      protocol: "https:",
      pathname: "",
      port: "",
      hash: "",
    },
    store: {
      val1: "number 1",
      val2: "number 2",
    },
    geolocation: {
      canBeRequested: true,
      currentPosition: {},
    },
    mode: "EDIT",
    theme: {
      colors: {
        primaryColor: "#553DE9",
        backgroundColor: "#F6F6F6",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        appFont: "Nunito Sans",
      },
    },
    ENTITY_TYPE: "APPSMITH",
  },
};

describe("7. Test util methods", () => {
  describe("makeDataTreeEntityConfigAsProperty", () => {
    it("should not introduce __evaluation__ property", () => {
      const dataTree = makeEntityConfigsAsObjProperties(
        unevalTreeFromMainThread as unknown as DataTree,
      );

      expect(dataTree.Api2).not.toHaveProperty("__evaluation__");
    });
    describe("identicalEvalPathsPatches decompress updates", () => {
      it("should decompress identicalEvalPathsPatches updates into evalProps and state", () => {
        const state = {
          Table1: {
            filteredTableData: smallDataSet,
            selectedRows: [],
            pageSize: 0,
            __evaluation__: {
              evaluatedValues: {},
            },
          },
        } as any;

        const identicalEvalPathsPatches = {
          "Table1.__evaluation__.evaluatedValues.['filteredTableData']":
            "Table1.filteredTableData",
        };
        const evalProps = {
          Table1: {
            __evaluation__: {
              evaluatedValues: {
                someProp: "abc",
              },
            },
          },
        } as any;
        const dataTree = makeEntityConfigsAsObjProperties(state as any, {
          sanitizeDataTree: true,
          evalProps,
          identicalEvalPathsPatches,
        });
        const expectedState = produce(state, (draft: any) => {
          draft.Table1.__evaluation__.evaluatedValues.someProp = "abc";
          draft.Table1.__evaluation__.evaluatedValues.filteredTableData =
            smallDataSet;
        });

        expect(dataTree).toEqual(expectedState);
        //evalProps should have decompressed updates in it coming from identicalEvalPathsPatches
        const expectedEvalProps = produce(evalProps, (draft: any) => {
          draft.Table1.__evaluation__.evaluatedValues.filteredTableData =
            smallDataSet;
        });
        expect(evalProps).toEqual(expectedEvalProps);
      });

      it("should not make any updates to evalProps when the identicalEvalPathsPatches is empty", () => {
        const state = {
          Table1: {
            filteredTableData: smallDataSet,
            selectedRows: [],
            pageSize: 0,
            __evaluation__: {
              evaluatedValues: {},
            },
          },
        } as any;

        const identicalEvalPathsPatches = {};
        const initialEvalProps = {} as any;
        const evalProps = cloneDeep(initialEvalProps);
        const dataTree = makeEntityConfigsAsObjProperties(state, {
          sanitizeDataTree: true,
          evalProps,
          identicalEvalPathsPatches,
        });

        expect(dataTree).toEqual(dataTree);
        //evalProps not be mutated with any updates
        expect(evalProps).toEqual(initialEvalProps);
      });

      it("should ignore non relevant identicalEvalPathsPatches updates into evalProps and state", () => {
        const state = {
          Table1: {
            filteredTableData: smallDataSet,
            selectedRows: [],
            pageSize: 0,
            __evaluation__: {
              evaluatedValues: {},
            },
          },
        } as any;
        //ignore non existent widget state
        const identicalEvalPathsPatches = {
          "SomeWidget.__evaluation__.evaluatedValues.['filteredTableData']":
            "SomeWidget.filteredTableData",
        };

        const initialEvalProps = {
          Table1: {
            __evaluation__: {
              evaluatedValues: {
                someProp: "abc",
              },
            },
          },
        } as any;
        const evalProps = cloneDeep(initialEvalProps);
        const dataTree = makeEntityConfigsAsObjProperties(state, {
          sanitizeDataTree: true,
          evalProps,
          identicalEvalPathsPatches,
        });
        const expectedState = produce(state, (draft: any) => {
          draft.Table1.__evaluation__.evaluatedValues.someProp = "abc";
        });

        expect(dataTree).toEqual(expectedState);
        //evalProps not be mutated with any updates
        expect(evalProps).toEqual(initialEvalProps);
      });
    });
  });
});
