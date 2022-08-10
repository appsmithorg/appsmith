import {
  DependencyMap,
  EVAL_ERROR_PATH,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import {
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
  PrivateWidgets,
} from "entities/DataTree/dataTreeFactory";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getAllPaths,
  getAllPrivateWidgetsInDataTree,
  getDataTreeWithoutPrivateWidgets,
  isPrivateEntityPath,
  makeParentsDependOnChildren,
  removeLintErrorsFromEntityProperty,
  translateDiffEventToDataTreeDiffEvent,
} from "./evaluationUtils";
import { warn as logWarn } from "loglevel";
import { Diff } from "deep-diff";
import _, { get, flatten } from "lodash";
import { overrideWidgetProperties } from "./evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { EvalMetaUpdates } from "./DataTreeEvaluator/types";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import TableWidget, { CONFIG as TableWidgetConfig } from "widgets/TableWidget";
import InputWidget, {
  CONFIG as InputWidgetV2Config,
} from "widgets/InputWidgetV2";
import { registerWidget } from "utils/WidgetRegisterHelpers";
import { Severity } from "entities/AppsmithConsole";

// to check if logWarn was called.
// use jest.unmock, if the mock needs to be removed.
jest.mock("loglevel");

const BASE_WIDGET: DataTreeWidget = {
  logBlackList: {},
  widgetId: "randomID",
  widgetName: "randomWidgetName",
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  parentId: "0",
  version: 1,
  bindingPaths: {},
  reactivePaths: {},
  triggerPaths: {},
  validationPaths: {},
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  privateWidgets: {},
  propertyOverrideDependency: {},
  overridingPropertyPaths: {},
  meta: {},
};

const testDataTree: Record<string, DataTreeWidget> = {
  Text1: {
    ...BASE_WIDGET,
    widgetName: "Text1",
    text: "Label",
    type: "TEXT_WIDGET",
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },
  Text2: {
    ...BASE_WIDGET,
    widgetName: "Text2",
    text: "{{Text1.text}}",
    dynamicBindingPathList: [{ key: "text" }],
    type: "TEXT_WIDGET",
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },
  Text3: {
    ...BASE_WIDGET,
    widgetName: "Text3",
    text: "{{Text1.text}}",
    dynamicBindingPathList: [{ key: "text" }],
    type: "TEXT_WIDGET",
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },
  Text4: {
    ...BASE_WIDGET,
    widgetName: "Text4",
    text: "{{Text1.text}}",
    dynamicBindingPathList: [{ key: "text" }],
    type: "TEXT_WIDGET",
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },

  List1: {
    ...BASE_WIDGET,
    privateWidgets: {
      Text2: true,
    },
  },
  List2: {
    ...BASE_WIDGET,
    privateWidgets: {
      Text3: true,
    },
  },
  Button1: {
    ...BASE_WIDGET,
    text: "undefined",
    __evaluation__: {
      errors: {
        text: [
          {
            errorType: PropertyEvaluationErrorType.LINT,
            raw:
              " function closedFunction () { const result = Api24 return result; } closedFunction.call(THIS_CONTEXT) ",
            severity: Severity.ERROR,
            errorMessage: "'Api24' is not defined.",
            errorSegment: " const result = Api24",
            originalBinding: "Api24",
          },
        ],
      },
    },
  },
};

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
});

describe("privateWidgets", () => {
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

  it("Returns list of all privateWidgets", () => {
    const expectedPrivateWidgetsList = {
      Text2: true,
      Text3: true,
    };

    const actualPrivateWidgetsList = getAllPrivateWidgetsInDataTree(
      testDataTree,
    );

    expect(expectedPrivateWidgetsList).toStrictEqual(actualPrivateWidgetsList);
  });

  it("Returns data tree without privateWidgets", () => {
    const expectedDataTreeWithoutPrivateWidgets: Record<
      string,
      DataTreeWidget
    > = {
      Text1: {
        ...BASE_WIDGET,
        widgetName: "Text1",
        text: "Label",
        type: "TEXT_WIDGET",
        reactivePaths: {
          text: EvaluationSubstitutionType.TEMPLATE,
        },
        validationPaths: {
          text: { type: ValidationTypes.TEXT },
        },
      },

      Text4: {
        ...BASE_WIDGET,
        widgetName: "Text4",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
        reactivePaths: {
          text: EvaluationSubstitutionType.TEMPLATE,
        },
        validationPaths: {
          text: { type: ValidationTypes.TEXT },
        },
      },

      List1: {
        ...BASE_WIDGET,
        privateWidgets: {
          Text2: true,
        },
      },
      List2: {
        ...BASE_WIDGET,
        privateWidgets: {
          Text3: true,
        },
      },
      Button1: {
        ...BASE_WIDGET,
        text: "undefined",
        __evaluation__: {
          errors: {
            text: [
              {
                errorType: PropertyEvaluationErrorType.LINT,
                raw:
                  " function closedFunction () { const result = Api24 return result; } closedFunction.call(THIS_CONTEXT) ",
                severity: Severity.ERROR,
                errorMessage: "'Api24' is not defined.",
                errorSegment: " const result = Api24",
                originalBinding: "Api24",
              },
            ],
          },
        },
      },
    };

    const actualDataTreeWithoutPrivateWidgets = getDataTreeWithoutPrivateWidgets(
      testDataTree,
    );

    expect(expectedDataTreeWithoutPrivateWidgets).toStrictEqual(
      actualDataTreeWithoutPrivateWidgets,
    );
  });
});

describe("makeParentsDependOnChildren", () => {
  it("makes parent properties depend on child properties", () => {
    let depMap: DependencyMap = {
      Widget1: [],
      "Widget1.defaultText": [],
      "Widget1.defaultText.abc": [],
    };
    const allkeys: Record<string, true> = {
      Widget1: true,
      "Widget1.defaultText": true,
      "Widget1.defaultText.abc": true,
    };
    depMap = makeParentsDependOnChildren(depMap, allkeys);
    expect(depMap).toStrictEqual({
      Widget1: ["Widget1.defaultText"],
      "Widget1.defaultText": ["Widget1.defaultText.abc"],
      "Widget1.defaultText.abc": [],
    });
  });

  it("logs warning for child properties not listed in allKeys", () => {
    const depMap: DependencyMap = {
      Widget1: [],
      "Widget1.defaultText": [],
    };
    const allkeys: Record<string, true> = {
      Widget1: true,
    };
    makeParentsDependOnChildren(depMap, allkeys);
    expect(logWarn).toBeCalledWith(
      "makeParentsDependOnChild - Widget1.defaultText is not present in dataTree.",
      "This might result in a cyclic dependency.",
    );
  });
});

describe("translateDiffEvent", () => {
  it("noop when diff path does not exist", () => {
    const noDiffPath: Diff<any, any> = {
      kind: "E",
      lhs: undefined,
      rhs: undefined,
    };
    const result = translateDiffEventToDataTreeDiffEvent(noDiffPath, {});
    expect(result).toStrictEqual({
      payload: {
        propertyPath: "",
        value: "",
      },
      event: DataTreeDiffEvent.NOOP,
    });
  });
  it("translates new and delete events", () => {
    const diffs: Diff<any, any>[] = [
      {
        kind: "N",
        path: ["Widget1"],
        rhs: {},
      },
      {
        kind: "N",
        path: ["Widget1", "name"],
        rhs: "Widget1",
      },
      {
        kind: "D",
        path: ["Widget1"],
        lhs: {},
      },
      {
        kind: "D",
        path: ["Widget1", "name"],
        lhs: "Widget1",
      },
      {
        kind: "E",
        path: ["Widget2", "name"],
        rhs: "test",
        lhs: "test2",
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        payload: {
          propertyPath: "Widget1",
        },
        event: DataTreeDiffEvent.NEW,
      },
      {
        payload: {
          propertyPath: "Widget1.name",
        },
        event: DataTreeDiffEvent.NEW,
      },
      {
        payload: {
          propertyPath: "Widget1",
        },
        event: DataTreeDiffEvent.DELETE,
      },
      {
        payload: {
          propertyPath: "Widget1.name",
        },
        event: DataTreeDiffEvent.DELETE,
      },
      {
        payload: {
          propertyPath: "Widget2.name",
          value: "",
        },
        event: DataTreeDiffEvent.NOOP,
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) => translateDiffEventToDataTreeDiffEvent(diff, {})),
    );

    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("properly categorises the edit events", () => {
    const diffs: Diff<any, any>[] = [
      {
        kind: "E",
        path: ["Widget2", "name"],
        rhs: "test",
        lhs: "test2",
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        payload: {
          propertyPath: "Widget2.name",
          value: "",
        },
        event: DataTreeDiffEvent.NOOP,
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) => translateDiffEventToDataTreeDiffEvent(diff, {})),
    );
    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("handles JsObject function renaming", () => {
    // cyclic dependency case
    const lhs = new String("() => {}");
    _.set(lhs, "data", {});
    const diffs: Diff<any, any>[] = [
      {
        kind: "E",
        path: ["JsObject", "myFun1"],
        rhs: "() => {}",
        lhs,
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        event: DataTreeDiffEvent.DELETE,
        payload: {
          propertyPath: "JsObject.myFun1.data",
        },
      },
      {
        event: DataTreeDiffEvent.EDIT,
        payload: {
          propertyPath: "JsObject.myFun1",
          value: "() => {}",
        },
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, {
          JsObject: ({
            ENTITY_TYPE: ENTITY_TYPE.JSACTION,
          } as unknown) as DataTreeEntity,
        }),
      ),
    );

    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("lists array accessors when object is replaced by an array", () => {
    const diffs: Diff<any, any>[] = [
      {
        kind: "E",
        path: ["Api1", "data"],
        lhs: {},
        rhs: [{ id: 1 }, { id: 2 }],
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        payload: {
          propertyPath: "Api1.data[0]",
        },
        event: DataTreeDiffEvent.NEW,
      },
      {
        payload: {
          propertyPath: "Api1.data[1]",
        },
        event: DataTreeDiffEvent.NEW,
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) => translateDiffEventToDataTreeDiffEvent(diff, {})),
    );

    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("lists array accessors when array is replaced by an object", () => {
    const diffs: Diff<any, any>[] = [
      {
        kind: "E",
        path: ["Api1", "data"],
        lhs: [{ id: 1 }, { id: 2 }],
        rhs: {},
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        payload: {
          propertyPath: "Api1.data[0]",
        },
        event: DataTreeDiffEvent.DELETE,
      },
      {
        payload: {
          propertyPath: "Api1.data[1]",
        },
        event: DataTreeDiffEvent.DELETE,
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) => translateDiffEventToDataTreeDiffEvent(diff, {})),
    );

    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("deletes member expressions when Array changes to string", () => {
    const diffs: Diff<any, any>[] = [
      {
        kind: "E",
        path: ["Api1", "data"],
        lhs: [{ id: "{{a}}" }, { id: "{{a}}" }],
        rhs: `{ id: "{{a}}" }, { id: "{{a}}" }`,
      },
    ];

    const expectedTranslations: DataTreeDiff[] = [
      {
        payload: {
          propertyPath: "Api1.data",
          value: `{ id: "{{a}}" }, { id: "{{a}}" }`,
        },
        event: DataTreeDiffEvent.EDIT,
      },
      {
        payload: {
          propertyPath: "Api1.data[0]",
        },
        event: DataTreeDiffEvent.DELETE,
      },
      {
        payload: {
          propertyPath: "Api1.data[1]",
        },
        event: DataTreeDiffEvent.DELETE,
      },
    ];

    const actualTranslations = flatten(
      diffs.map((diff) => translateDiffEventToDataTreeDiffEvent(diff, {})),
    );

    expect(expectedTranslations).toEqual(actualTranslations);
  });
});

describe("overrideWidgetProperties", () => {
  beforeAll(() => {
    registerWidget(TableWidget, TableWidgetConfig);
    registerWidget(InputWidget, InputWidgetV2Config);
  });

  describe("1. Input widget ", () => {
    const currentTree: DataTree = {};
    beforeAll(() => {
      const inputWidgetDataTree = generateDataTreeWidget(
        {
          type: InputWidget.getWidgetType(),
          widgetId: "egwwwfgab",
          widgetName: "Input1",
          children: [],
          bottomRow: 0,
          isLoading: false,
          parentColumnSpace: 0,
          parentRowSpace: 0,
          version: 1,
          leftColumn: 0,
          renderMode: RenderModes.CANVAS,
          rightColumn: 0,
          topRow: 0,
        },
        {},
      );
      currentTree["Input1"] = inputWidgetDataTree;
    });
    // When default text is re-evaluated it will override values of meta.text and text in InputWidget
    it("1. defaultText updating meta.text and text", () => {
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        currentTree,
        entity: currentTree.Input1 as DataTreeWidget,
        propertyPath: "defaultText",
        value: "abcde",
        evalMetaUpdates,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([
        {
          //@ts-expect-error: widgetId does not exits on type DataTreeEntity
          widgetId: currentTree.Input1.widgetId,
          metaPropertyPath: ["inputText"],
          value: "abcde",
        },
        {
          //@ts-expect-error: widgetId does not exits on type DataTreeEntity
          widgetId: currentTree.Input1.widgetId,
          metaPropertyPath: ["text"],
          value: "abcde",
        },
      ]);

      //@ts-expect-error: meta does not exits on type DataTreeEntity
      expect(currentTree.Input1.meta).toStrictEqual({
        text: "abcde",
        inputText: "abcde",
      });
    });
    // When meta.text is re-evaluated it will override values text in InputWidget
    it("2. meta.text updating text", () => {
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        currentTree,
        entity: currentTree.Input1 as DataTreeWidget,
        propertyPath: "meta.text",
        value: "abcdefg",
        evalMetaUpdates,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([]);

      //@ts-expect-error: text does not exits on type DataTreeEntity
      expect(currentTree.Input1.text).toStrictEqual("abcdefg");
    });
  });

  describe("2. Table widget ", () => {
    const currentTree: DataTree = {};
    beforeAll(() => {
      const tableWidgetDataTree = generateDataTreeWidget(
        {
          type: TableWidget.getWidgetType(),
          widgetId: "random",
          widgetName: "Table1",
          children: [],
          bottomRow: 0,
          isLoading: false,
          parentColumnSpace: 0,
          parentRowSpace: 0,
          version: 1,
          leftColumn: 0,
          renderMode: RenderModes.CANVAS,
          rightColumn: 0,
          topRow: 0,
        },
        {},
      );
      currentTree["Table1"] = tableWidgetDataTree;
    });
    // When default defaultSelectedRow is re-evaluated it will override values of meta.selectedRowIndices, selectedRowIndices, meta.selectedRowIndex & selectedRowIndex.
    it("1. On change of defaultSelectedRow ", () => {
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        currentTree,
        entity: currentTree.Table1 as DataTreeWidget,
        propertyPath: "defaultSelectedRow",
        value: [0, 1],
        evalMetaUpdates,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([
        {
          //@ts-expect-error: widgetId does not exits on type DataTreeEntity
          widgetId: currentTree.Table1.widgetId,
          metaPropertyPath: ["selectedRowIndex"],
          value: [0, 1],
        },
        {
          //@ts-expect-error: widgetId does not exits on type DataTreeEntity
          widgetId: currentTree.Table1.widgetId,
          metaPropertyPath: ["selectedRowIndices"],
          value: [0, 1],
        },
      ]);

      //@ts-expect-error: meta does not exits on type DataTreeEntity
      expect(currentTree.Table1.meta.selectedRowIndex).toStrictEqual([0, 1]);
      //@ts-expect-error: meta does not exits on type DataTreeEntity
      expect(currentTree.Table1.meta.selectedRowIndices).toStrictEqual([0, 1]);
    });
    // When meta.selectedRowIndex is re-evaluated it will override values selectedRowIndex
    it("2. meta.selectedRowIndex updating selectedRowIndex", () => {
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        currentTree,
        entity: currentTree.Table1 as DataTreeWidget,
        propertyPath: "meta.selectedRowIndex",
        value: 0,
        evalMetaUpdates,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([]);

      //@ts-expect-error: selectedRowIndex does not exits on type DataTreeEntity
      expect(currentTree.Table1.selectedRowIndex).toStrictEqual(0);
    });
  });
});

describe("removeLintErrorsFromEntityProperty", () => {
  it("returns correct result", function() {
    const dataTree: DataTree = { ...testDataTree };
    const path = "Button1.text";
    removeLintErrorsFromEntityProperty(dataTree, path);
    expect(get(dataTree, `Button1.${EVAL_ERROR_PATH}[text]`)).toEqual([]);
  });
});
