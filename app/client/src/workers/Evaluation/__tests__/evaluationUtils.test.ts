import { DependencyMap } from "utils/DynamicBindingUtils";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import {
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
  UnEvalTree,
  UnEvalTreeAction,
} from "entities/DataTree/dataTreeFactory";
import { PrivateWidgets } from "entities/DataTree/types";
import {
  createDataTreeWithConfig,
  createNewEntity,
  createUnEvalTreeForEval,
  DataTreeDiff,
  DataTreeDiffEvent,
  getAllPaths,
  getAllPrivateWidgetsInDataTree,
  getDataTreeWithoutPrivateWidgets,
  isPrivateEntityPath,
  makeParentsDependOnChildren,
  translateDiffEventToDataTreeDiffEvent,
} from "../evaluationUtils";
import { warn as logWarn } from "loglevel";
import { Diff } from "deep-diff";
import _, { flatten } from "lodash";
import { overrideWidgetProperties, findDatatype } from "../evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { EvalMetaUpdates } from "../../common/DataTreeEvaluator/types";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import TableWidget, { CONFIG as TableWidgetConfig } from "widgets/TableWidget";
import InputWidget, {
  CONFIG as InputWidgetV2Config,
} from "widgets/InputWidgetV2";
import { registerWidget } from "utils/WidgetRegisterHelpers";
import { WidgetConfiguration } from "widgets/constants";

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
        text: [],
      },
    },
  },
};

describe("1. Correctly handle paths", () => {
  it("1. getsAllPaths", () => {
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

describe("2. privateWidgets", () => {
  it("1. correctly checks if path is a PrivateEntityPath", () => {
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

  it("2. Returns list of all privateWidgets", () => {
    const expectedPrivateWidgetsList = {
      Text2: true,
      Text3: true,
    };

    const actualPrivateWidgetsList = getAllPrivateWidgetsInDataTree(
      testDataTree,
    );

    expect(expectedPrivateWidgetsList).toStrictEqual(actualPrivateWidgetsList);
  });

  it("3. Returns data tree without privateWidgets", () => {
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
            text: [],
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

describe("3. makeParentsDependOnChildren", () => {
  it("1. makes parent properties depend on child properties", () => {
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

  it("2. logs warning for child properties not listed in allKeys", () => {
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

describe("4. translateDiffEvent", () => {
  it("1. noop when diff path does not exist", () => {
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
  it("2. translates new and delete events", () => {
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

  it("3. properly categorises the edit events", () => {
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

  it("4. handles JsObject function renaming", () => {
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

  it("5. lists array accessors when object is replaced by an array", () => {
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

  it("6. lists array accessors when array is replaced by an object", () => {
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

  it("7. deletes member expressions when Array changes to string", () => {
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

describe("5. overrideWidgetProperties", () => {
  beforeAll(() => {
    registerWidget(TableWidget, TableWidgetConfig);
    registerWidget(
      InputWidget,
      (InputWidgetV2Config as unknown) as WidgetConfiguration,
    );
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
      currentTree["Input1"] = createNewEntity(inputWidgetDataTree);
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
      currentTree["Table1"] = createNewEntity(tableWidgetDataTree);
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

//A set of test cases to evaluate the logic for finding a given value's datatype
describe("6. Evaluated Datatype of a given value", () => {
  it("1. Numeric datatypes", () => {
    expect(findDatatype(37)).toBe("number");
    expect(findDatatype(3.14)).toBe("number");
    expect(findDatatype(Math.LN2)).toBe("number");
    expect(findDatatype(Infinity)).toBe("number");
    expect(findDatatype(Number(1))).toBe("number");
    expect(findDatatype(new Number(1))).toBe("number");
    expect(findDatatype("1")).not.toBe("number");
  });
  it("2. String datatypes", () => {
    expect(findDatatype("")).toBe("string");
    expect(findDatatype("bla")).toBe("string");
    expect(findDatatype(String("abc"))).toBe("string");
    expect(findDatatype(new String("abc"))).toBe("string");
    expect(findDatatype(parseInt("1"))).not.toBe("string");
  });
  it("3. Boolean datatypes", () => {
    expect(findDatatype(true)).toBe("boolean");
    expect(findDatatype(false)).toBe("boolean");
    expect(findDatatype(Boolean(true))).toBe("boolean");
    expect(findDatatype(Boolean(false))).toBe("boolean");
    expect(findDatatype(new Boolean(false))).toBe("boolean");
    expect(findDatatype("true")).not.toBe("boolean");
  });
  it("4. Objects datatypes", () => {
    expect(findDatatype(null)).toBe("null");
    expect(findDatatype(undefined)).toBe("undefined");
    let tempDecVar;
    expect(findDatatype(tempDecVar)).toBe("undefined");
    expect(findDatatype({ a: 1 })).toBe("object");
    expect(findDatatype({})).toBe("object");
    expect(findDatatype(new Date())).toBe("date");
    const func = function() {
      return "hello world";
    };
    expect(findDatatype(func)).toBe("function");
    expect(findDatatype(Math.sin)).toBe("function");
    expect(findDatatype(/test/i)).toBe("regexp");
  });
  it("5. Array datatypes", () => {
    expect(findDatatype([1, 2, 3])).toBe("array");
    expect(findDatatype([])).toBe("array");
    expect(findDatatype(["a", true, 3, null])).toBe("array");
    expect(findDatatype([1, 2, 3])).toBe("array");
    expect(findDatatype(Array.of("a", "b", "c"))).toBe("array");
    expect(findDatatype("a, b, c")).not.toBe("array");
  });
});

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
    __config__: {
      actionId: "6380b1003a20d922b774eb75",
      name: "Api2",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: "API",
      dynamicBindingPathList: [
        {
          key: "config.path",
        },
      ],
      ENTITY_TYPE: "ACTION",
      bindingPaths: {
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        data: "TEMPLATE",
        isLoading: "TEMPLATE",
        datasourceUrl: "TEMPLATE",
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
          "SMART_SUBSTITUTE",
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    },
  },
  JSObject1: {
    newFunction: {
      data: {},
    },
    storeTest2: {
      data: {},
    },
    body:
      "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
    ENTITY_TYPE: "JSACTION",
    __config__: {
      meta: {
        newFunction: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
        storeTest2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject1",
      actionId: "637cda3b2f8e175c6f5269d5",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "newFunction",
        },
        {
          key: "storeTest2",
        },
      ],
      variables: [],
      dependencyMap: {
        body: ["newFunction", "storeTest2"],
      },
    },
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
    __config__: {
      defaultProps: {},
      defaultMetaProps: [],
      dynamicBindingPathList: [],
      logBlackList: {},
      bindingPaths: {},
      reactivePaths: {},
      triggerPaths: {},
      validationPaths: {},
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "CANVAS_WIDGET",
    },
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
    __config__: {
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
      ],
      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      triggerPaths: {
        onClick: true,
      },
      validationPaths: {
        text: {
          type: "TEXT",
        },
        tooltip: {
          type: "TEXT",
        },
        isVisible: {
          type: "BOOLEAN",
        },
        isDisabled: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        googleRecaptchaKey: {
          type: "TEXT",
        },
        recaptchaType: {
          type: "TEXT",
          params: {
            allowedValues: ["V3", "V2"],
            default: "V3",
          },
        },
        disabledWhenInvalid: {
          type: "BOOLEAN",
        },
        resetFormOnClick: {
          type: "BOOLEAN",
        },
        buttonVariant: {
          type: "TEXT",
          params: {
            allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            default: "PRIMARY",
          },
        },
        iconName: {
          type: "TEXT",
        },
        placement: {
          type: "TEXT",
          params: {
            allowedValues: ["START", "BETWEEN", "CENTER"],
            default: "CENTER",
          },
        },
        buttonColor: {
          type: "TEXT",
        },
        borderRadius: {
          type: "TEXT",
        },
        boxShadow: {
          type: "TEXT",
        },
      },
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "BUTTON_WIDGET",
      dynamicTriggerPathList: [],
    },
  },
  pageList: [
    {
      pageName: "Page1",
      pageId: "63349fb5d39f215f89b8245e",
      isDefault: false,
      isHidden: false,
      slug: "page1",
    },
    {
      pageName: "Page2",
      pageId: "637cc6b4a3664a7fe679b7b0",
      isDefault: true,
      isHidden: false,
      slug: "page2",
    },
  ],
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
  it("1. createUnEvalTree method", () => {
    const unEvalTreeForEval = createUnEvalTreeForEval(
      (unevalTreeFromMainThread as unknown) as UnEvalTree,
    );
    // Action config
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.bindingPaths",
      unevalTreeFromMainThread.Api2.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Api2.reactivePaths",
      unevalTreeFromMainThread.Api2.__config__.reactivePaths,
    );

    // widget config
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.dynamicBindingPathList",
      unevalTreeFromMainThread.Button2.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.bindingPaths",
      unevalTreeFromMainThread.Button2.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "Button2.reactivePaths",
      unevalTreeFromMainThread.Button2.__config__.reactivePaths,
    );

    // appsmith object config
    expect(unEvalTreeForEval).toHaveProperty(
      "appsmith",
      unevalTreeFromMainThread.appsmith,
    );

    // JSObject config
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.dynamicBindingPathList",
      unevalTreeFromMainThread.JSObject1.__config__.dynamicBindingPathList,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.bindingPaths",
      unevalTreeFromMainThread.JSObject1.__config__.bindingPaths,
    );
    expect(unEvalTreeForEval).toHaveProperty(
      "JSObject1.reactivePaths",
      unevalTreeFromMainThread.JSObject1.__config__.reactivePaths,
    );
  });

  it("2. createNewEntity method", () => {
    const actionForEval = createNewEntity(
      (unevalTreeFromMainThread.Api2 as unknown) as UnEvalTreeAction,
    );
    // Action config
    expect(actionForEval).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
    expect(actionForEval).not.toHaveProperty("__config__");

    const widgetForEval = createNewEntity(
      (unevalTreeFromMainThread.Button2 as unknown) as UnEvalTreeAction,
    );
    // widget config
    expect(widgetForEval).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Button2.__config__.dynamicBindingPathList,
    );
    expect(widgetForEval).not.toHaveProperty("__config__");
  });

  it("3. createDataTreeWithConfig method", () => {
    const unEvalTreeForEval = createUnEvalTreeForEval(
      (unevalTreeFromMainThread as unknown) as UnEvalTree,
    );
    const dataTree = createDataTreeWithConfig(unEvalTreeForEval);

    expect(dataTree.Api2).not.toHaveProperty("__config__");

    expect(dataTree.Api2).toHaveProperty(
      "dynamicBindingPathList",
      unevalTreeFromMainThread.Api2.__config__.dynamicBindingPathList,
    );
  });
});
