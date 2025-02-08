import type { DependencyMap, EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import microDiff from "microdiff";

import type {
  WidgetEntity,
  WidgetEntityConfig,
  PrivateWidgets,
  JSActionEntity,
} from "ee/entities/DataTree/types";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTreeEntity,
  DataTree,
} from "entities/DataTree/dataTreeTypes";
import type { DataTreeDiff } from "ee/workers/Evaluation/evaluationUtils";
import { convertMicroDiffToDeepDiff } from "ee/workers/Evaluation/evaluationUtils";
import {
  addErrorToEntityProperty,
  convertJSFunctionsToString,
  DataTreeDiffEvent,
  getAllPaths,
  getAllPrivateWidgetsInDataTree,
  getDataTreeWithoutPrivateWidgets,
  isPrivateEntityPath,
  makeParentsDependOnChildren,
  translateDiffEventToDataTreeDiffEvent,
} from "ee/workers/Evaluation/evaluationUtils";
import { warn as logWarn } from "loglevel";
import type { Diff } from "deep-diff";
import _, { flatten, set } from "lodash";
import {
  overrideWidgetProperties,
  findDatatype,
} from "ee/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import TableWidget from "widgets/TableWidget";
import InputWidget from "widgets/InputWidgetV2";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import { Severity } from "entities/AppsmithConsole";
import { PluginType } from "entities/Plugin";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";

// to check if logWarn was called.
// use jest.unmock, if the mock needs to be removed.
jest.mock("loglevel");

const BASE_WIDGET: WidgetEntity = {
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
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  meta: {},
};

const BASE_WIDGET_CONFIG: WidgetEntityConfig = {
  logBlackList: {},
  widgetId: "randomID",
  type: "SKELETON_WIDGET",
  bindingPaths: {},
  reactivePaths: {},
  triggerPaths: {},
  validationPaths: {},
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  privateWidgets: {},
  propertyOverrideDependency: {},
  overridingPropertyPaths: {},
  defaultMetaProps: [],
};

const testDataTree: Record<string, WidgetEntity> = {
  Text1: {
    ...BASE_WIDGET,
    widgetName: "Text1",
    text: "Label",
    type: "TEXT_WIDGET",
  },
  Text2: {
    ...BASE_WIDGET,
    widgetName: "Text2",
    text: "{{Text1.text}}",
    type: "TEXT_WIDGET",
  },
  Text3: {
    ...BASE_WIDGET,
    widgetName: "Text3",
    text: "{{Text1.text}}",

    type: "TEXT_WIDGET",
  },
  Text4: {
    ...BASE_WIDGET,
    widgetName: "Text4",
    text: "{{Text1.text}}",
    type: "TEXT_WIDGET",
  },

  List1: {
    ...BASE_WIDGET,
  },
  List2: {
    ...BASE_WIDGET,
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

const testConfigTree: ConfigTree = {
  Text1: {
    ...BASE_WIDGET_CONFIG,
    type: "TEXT_WIDGET",
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },
  Text2: {
    ...BASE_WIDGET_CONFIG,
    type: "TEXT_WIDGET",
    dynamicBindingPathList: [{ key: "text" }],
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
  },
  Text3: {
    ...BASE_WIDGET_CONFIG,
    dynamicBindingPathList: [{ key: "text" }],
    reactivePaths: {
      text: EvaluationSubstitutionType.TEMPLATE,
    },
    validationPaths: {
      text: { type: ValidationTypes.TEXT },
    },
    type: "TEXT_WIDGET",
  },
  Text4: {
    ...BASE_WIDGET_CONFIG,
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
    ...BASE_WIDGET_CONFIG,
    privateWidgets: {
      Text2: true,
    },
  },
  List2: {
    ...BASE_WIDGET_CONFIG,
    privateWidgets: {
      Text3: true,
    },
  },
  Button1: {
    ...BASE_WIDGET_CONFIG,
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
        stringProperty: new String("Hello"),
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
      "WidgetName.stringProperty": true,
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

    const actualPrivateWidgetsList =
      getAllPrivateWidgetsInDataTree(testConfigTree);

    expect(expectedPrivateWidgetsList).toStrictEqual(actualPrivateWidgetsList);
  });

  it("3. Returns data tree without privateWidgets", () => {
    const expectedDataTreeWithoutPrivateWidgets: Record<string, WidgetEntity> =
      {
        Text1: {
          ...BASE_WIDGET,
          widgetName: "Text1",
          text: "Label",
          type: "TEXT_WIDGET",
        },

        Text4: {
          ...BASE_WIDGET,
          widgetName: "Text4",
          text: "{{Text1.text}}",
          type: "TEXT_WIDGET",
        },

        List1: {
          ...BASE_WIDGET,
        },
        List2: {
          ...BASE_WIDGET,
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

    const actualDataTreeWithoutPrivateWidgets =
      getDataTreeWithoutPrivateWidgets(testDataTree, testConfigTree);

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          JsObject: {
            ENTITY_TYPE: ENTITY_TYPE.JSACTION,
          } as unknown as DataTreeEntity,
        }),
      ),
    );

    expect(expectedTranslations).toStrictEqual(actualTranslations);
  });

  it("5. lists array accessors when object is replaced by an array", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    registerWidgets([TableWidget, InputWidget]);
  });

  describe("1. Input widget ", () => {
    const currentTree: DataTree = {};
    const configTree: ConfigTree = {};

    beforeAll(() => {
      const inputWidgetDataTree = generateDataTreeWidget(
        {
          type: InputWidget.type,
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
        new Set(),
      );

      currentTree["Input1"] = inputWidgetDataTree.unEvalEntity;
      configTree["Input1"] = inputWidgetDataTree.configEntity;
    });
    // When default text is re-evaluated it will override values of meta.text and text in InputWidget
    it("1. defaultText updating meta.text and text", () => {
      const widgetEntity = currentTree.Input1 as WidgetEntity;
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        entity: widgetEntity,
        propertyPath: "defaultText",
        value: "abcde",

        currentTree,
        configTree,
        evalMetaUpdates,
        fullPropertyPath: "Input1.defaultText",
        isNewWidget: false,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([
        {
          widgetId: widgetEntity.widgetId,
          metaPropertyPath: ["inputText"],
          value: "abcde",
        },
        {
          widgetId: widgetEntity.widgetId,
          metaPropertyPath: ["text"],
          value: "abcde",
        },
      ]);

      expect(widgetEntity.meta).toStrictEqual({
        text: "abcde",
        inputText: "abcde",
      });
    });
    // When meta.text is re-evaluated it will override values text in InputWidget
    it("2. meta.text updating text", () => {
      const widgetEntity = currentTree.Input1 as WidgetEntity;
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        entity: widgetEntity,
        propertyPath: "meta.text",
        value: "abcdefg",
        currentTree,
        configTree,
        evalMetaUpdates,
        fullPropertyPath: "Input1.meta.text",
        isNewWidget: false,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([]);

      expect(widgetEntity.text).toStrictEqual("abcdefg");
    });
  });

  describe("2. Table widget ", () => {
    const currentTree: DataTree = {};
    const configTree: ConfigTree = {};

    beforeAll(() => {
      const tableWidgetDataTree = generateDataTreeWidget(
        {
          type: TableWidget.type,
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
        new Set(),
      );

      currentTree["Table1"] = tableWidgetDataTree.unEvalEntity;
      configTree["Table1"] = tableWidgetDataTree.configEntity;
    });
    // When default defaultSelectedRow is re-evaluated it will override values of meta.selectedRowIndices, selectedRowIndices, meta.selectedRowIndex & selectedRowIndex.
    it("1. On change of defaultSelectedRow ", () => {
      const widgetEntity = currentTree.Table1 as WidgetEntity;
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        entity: widgetEntity,
        propertyPath: "defaultSelectedRow",
        value: [0, 1],
        currentTree,
        configTree,
        evalMetaUpdates,
        fullPropertyPath: "Table1.defaultSelectedRow",
        isNewWidget: false,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([
        {
          widgetId: widgetEntity.widgetId,
          metaPropertyPath: ["selectedRowIndex"],
          value: [0, 1],
        },
        {
          widgetId: widgetEntity.widgetId,
          metaPropertyPath: ["selectedRowIndices"],
          value: [0, 1],
        },
      ]);

      expect(widgetEntity.meta.selectedRowIndex).toStrictEqual([0, 1]);

      expect(widgetEntity.meta.selectedRowIndices).toStrictEqual([0, 1]);
    });
    // When meta.selectedRowIndex is re-evaluated it will override values selectedRowIndex
    it("2. meta.selectedRowIndex updating selectedRowIndex", () => {
      const widgetEntity = currentTree.Table1 as WidgetEntity;
      const evalMetaUpdates: EvalMetaUpdates = [];
      const overwriteObj = overrideWidgetProperties({
        entity: widgetEntity,
        propertyPath: "meta.selectedRowIndex",
        value: 0,
        currentTree,
        configTree,
        evalMetaUpdates,
        fullPropertyPath: "Table1.meta.selectedRowIndex",
        isNewWidget: false,
      });

      expect(overwriteObj).toStrictEqual(undefined);

      expect(evalMetaUpdates).toStrictEqual([]);

      expect(widgetEntity.selectedRowIndex).toStrictEqual(0);
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
    const func = function () {
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

describe("7. Test addErrorToEntityProperty method", () => {
  it("Add error to dataTreeEvaluator.evalProps", () => {
    const dataTreeEvaluator = new DataTreeEvaluator({});
    const error = {
      errorMessage: { name: "", message: "some error" },
      errorType: PropertyEvaluationErrorType.VALIDATION,
      raw: "undefined",
      severity: Severity.ERROR,
      originalBinding: "",
    } as EvaluationError;

    addErrorToEntityProperty({
      errors: [error],
      evalProps: dataTreeEvaluator.evalProps,
      fullPropertyPath: "Api1.data",
      configTree: dataTreeEvaluator.oldConfigTree,
    });

    expect(
      dataTreeEvaluator.evalProps.Api1.__evaluation__?.errors.data[0],
    ).toEqual(error);
  });
});

describe("convertJSFunctionsToString", () => {
  const JSObject1MyFun1 = new String('() => {\n  return "name";\n}');

  set(JSObject1MyFun1, "data", {});
  const JSObject2MyFun1 = new String("() => {}");

  set(JSObject2MyFun1, "data", {});
  const JSObject2MyFun2 = new String("async () => {}");

  set(JSObject2MyFun2, "data", {});

  const configTree = {
    JSObject1: {
      variables: [],
      meta: {
        myFun1: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject1",
      actionId: "63ef4cb1a01b764626f2a6e5",
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      pluginType: PluginType.JS,
      bindingPaths: {
        body: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        body: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "myFun1",
        },
      ],
      dependencyMap: {
        body: ["myFun1"],
      },
    },
    JSObject2: {
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      meta: {
        myFun1: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
        myFun2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject2",
      actionId: "63f78437d1a4ef55755952f1",
      pluginType: PluginType.JS,
      bindingPaths: {
        body: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myVar1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myVar2: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun2: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        body: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myVar1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myVar2: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun1: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        myFun2: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "myVar1",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun1",
        },
        {
          key: "myFun2",
        },
      ],
      variables: ["myVar1", "myVar2"],
      dependencyMap: {
        body: ["myFun1", "myFun2"],
      },
    },
  } as unknown as ConfigTree;

  const jsCollections: Record<string, JSActionEntity> = {
    JSObject1: {
      myFun1: JSObject1MyFun1,
      body: 'export default {\nmyFun1:  ()=>{ \n\treturn "name"\n} \n}',
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,

      actionId: "63ef4cb1a01b764626f2a6e5",
    },
    JSObject2: {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: JSObject2MyFun1,
      myFun2: JSObject2MyFun2,
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,

      actionId: "63f78437d1a4ef55755952f1",
    },
  };
  const expectedResult = {
    JSObject1: {
      myFun1: '() => {\n  return "name";\n}',
      body: 'export default {\nmyFun1:  ()=>{ \n\treturn "name"\n} \n}',
      ENTITY_TYPE: "JSACTION",
      "myFun1.data": {},
      actionId: "63ef4cb1a01b764626f2a6e5",
    },
    JSObject2: {
      myVar1: "[]",
      myVar2: "{}",
      myFun1: "() => {}",
      myFun2: "async () => {}",
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
      "myFun1.data": {},
      "myFun2.data": {},
      actionId: "63f78437d1a4ef55755952f1",
    },
  };
  const actualResult = convertJSFunctionsToString(jsCollections, configTree);

  expect(expectedResult).toStrictEqual(actualResult);
});
describe("convertMicroDiffToDeepDiff", () => {
  it("should generate edit deepDiff updates", () => {
    const microDiffUpdates = microDiff({ a: 1, b: 2 }, { a: 1, b: 3 });
    const deepDiffUpdates = convertMicroDiffToDeepDiff(microDiffUpdates);

    expect(deepDiffUpdates).toStrictEqual([
      {
        kind: "E",
        lhs: 2,
        path: ["b"],
        rhs: 3,
      },
    ]);
  });
  it("should generate create deepDiff updates", () => {
    const microDiffUpdates = microDiff({ a: 1 }, { a: 1, b: 3 });
    const deepDiffUpdates = convertMicroDiffToDeepDiff(microDiffUpdates);

    expect(deepDiffUpdates).toStrictEqual([
      {
        kind: "N",
        path: ["b"],
        rhs: 3,
      },
    ]);
  });
  it("should generate delete deepDiff updates", () => {
    const microDiffUpdates = microDiff({ a: 1, b: 3 }, { a: 1 });
    const deepDiffUpdates = convertMicroDiffToDeepDiff(microDiffUpdates);

    expect(deepDiffUpdates).toStrictEqual([
      {
        kind: "D",
        path: ["b"],
        lhs: 3,
      },
    ]);
  });
});
