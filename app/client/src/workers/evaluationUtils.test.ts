import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import {
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
  PrivateWidgets,
} from "entities/DataTree/dataTreeFactory";
import {
  getAllPaths,
  getAllPrivateWidgetsInDataTree,
  getDataTreeWithoutPrivateWidgets,
  isPrivateEntityPath,
} from "./evaluationUtils";

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
  triggerPaths: {},
  validationPaths: {},
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  privateWidgets: {},
};

const testDataTree: Record<string, DataTreeWidget> = {
  Text1: {
    ...BASE_WIDGET,
    widgetName: "Text1",
    text: "Label",
    type: "TEXT_WIDGET",
    bindingPaths: {
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
    bindingPaths: {
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
    bindingPaths: {
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
    bindingPaths: {
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
        bindingPaths: {
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
        bindingPaths: {
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
