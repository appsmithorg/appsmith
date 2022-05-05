import { DependencyMap } from "utils/DynamicBindingUtils";
import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import {
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
  translateDiffEventToDataTreeDiffEvent,
} from "./evaluationUtils";
import { warn as logWarn } from "loglevel";
import { Diff } from "deep-diff";
import { flatten } from "lodash";
import { overrideWidgetProperties } from "./evaluationUtils";
import { DataTree } from "../entities/DataTree/dataTreeFactory";
import { EvalMetaUpdates } from "./DataTreeEvaluator/types";

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
          propertyPath: "",
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
          propertyPath: "",
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
});

describe("overrideWidgetProperties", () => {
  const currentTree: DataTree = {
    Input1: {
      widgetId: "Input1",
      defaultText: "abc",
      text: "",
      meta: {
        inputText: "",
        text: "",
      },
      overridingPropertyPaths: {
        defaultText: ["inputText", "meta.inputText", "text", "meta.text"],
        "meta.inputText": ["inputText"],
        "meta.text": ["text"],
      },
      propertyOverrideDependency: {
        inputText: {
          DEFAULT: "defaultText",
          META: "meta.inputText",
        },
        text: {
          DEFAULT: "defaultText",
          META: "meta.text",
        },
      },
    },
  };

  it("defaultText updating meta and text", () => {
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
      { widgetId: "Input1", metaPropertyPath: ["inputText"], value: "abcde" },
      { widgetId: "Input1", metaPropertyPath: ["text"], value: "abcde" },
    ]);
    // Fix test
    // expect(currentTree.Input1.meta).toStrictEqual("abcde");
  });
});
