import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import {
  buildChildWidgetTree,
  widgetErrorsFromStaticProps,
} from "./widgetRenderUtils";

jest.mock("../WidgetProvider/factory", () => {
  const originalModule = jest.requireActual("react-redux");

  return {
    ...originalModule,
    default: {
      ...originalModule.default,
      getConfig: (type: string) => {
        return {
          needsErrorInfo: type === "CHART_WIDGET",
        };
      },
      widgetTypes: {
        SKELETON_WIDGET: "SKELETON_WIDGET",
      },
    },
  };
});

describe("widgetErrorsFromStaticProps functionality", () => {
  it("returns an empty errors if no evaluations are present", function () {
    const dataTree = {} as unknown as WidgetEntity;

    const response = widgetErrorsFromStaticProps(dataTree);

    expect(response.length).toEqual(0);
  });

  it("returns an empty errors if no evaluation errors are present", () => {
    const dataTree = {
      __evaluation__: {},
    } as unknown as WidgetEntity;

    const response = widgetErrorsFromStaticProps(dataTree);

    expect(response.length).toEqual(0);
  });

  it("populates __evaluation__ errors inside widget error property for widget", () => {
    const dataTree = {
      __evaluation__: {
        errors: {
          propertyPath: [
            {
              errorMessage: {
                name: "Validation Error",
                message: "Error Message",
              },
              raw: "Error Message Stack",
            },
          ],
        },
      },
    } as unknown as WidgetEntity;

    const response = widgetErrorsFromStaticProps(dataTree);

    expect(response.length).toEqual(1);
    expect(response[0].name).toStrictEqual("Validation Error");
    expect(response[0].message).toStrictEqual("Error Message");
    expect(response[0].stack).toStrictEqual("Error Message Stack");
    expect(response[0].type).toStrictEqual("property");
    expect(response[0].path).toStrictEqual("propertyPath");
  });
});

describe("test EditorUtils methods", () => {
  describe("should test buildChildWidgetTree method", () => {
    const metaWidgets = {
      "1_meta": {
        children: ["2_meta"],
        type: "CANVAS",
        widgetId: "1_meta",
        parentId: "2",
        topRow: 0,
        bottomRow: 100,
        widgetName: "meta_one",
      },
      "2_meta": {
        children: [],
        type: "INPUT_WIDGET",
        widgetId: "2_meta",
        parentId: "1_meta",
        topRow: 0,
        bottomRow: 10,
        widgetName: "meta_two",
      },
    } as unknown as MetaWidgetsReduxState;
    const canvasWidgets = {
      "1": {
        children: ["2"],
        type: "FORM_WIDGET",
        widgetId: "1",
        parentId: "0",
        topRow: 0,
        bottomRow: 10,
        widgetName: "one",
      },
      "2": {
        children: ["3", "4", "1_meta"],
        type: "CANVAS",
        widgetId: "2",
        parentId: "1",
        topRow: 0,
        bottomRow: 100,
        widgetName: "two",
      },
      "3": {
        children: [],
        type: "TEXT",
        widgetId: "3",
        parentId: "2",
        topRow: 4,
        bottomRow: 5,
        widgetName: "three",
      },
      "4": {
        children: [],
        type: "BUTTON",
        widgetId: "4",
        parentId: "2",
        topRow: 6,
        bottomRow: 18,
        widgetName: "four",
      },
    } as unknown as CanvasWidgetsReduxState;

    const dataTree = {
      one: {
        children: ["2"],
        type: "FORM_WIDGET",
        widgetId: "1",
        parentId: "0",
        topRow: 0,
        bottomRow: 10,
        widgetName: "one",
        skipForFormWidget: "test",
        value: "test",
        isDirty: true,
        isValid: true,
      },
      two: {
        children: ["3", "4", "1_meta"],
        type: "CANVAS",
        widgetId: "2",
        parentId: "1",
        topRow: 0,
        bottomRow: 100,
        widgetName: "two",
        skipForFormWidget: "test",
        value: "test",
        isDirty: true,
        isValid: true,
      },
      three: {
        children: [],
        type: "TEXT",
        widgetId: "3",
        parentId: "2",
        topRow: 4,
        bottomRow: 5,
        widgetName: "three",
        skipForFormWidget: "test",
        value: "test",
        isDirty: true,
        isValid: true,
      },
      four: {
        children: [],
        type: "BUTTON",
        widgetId: "4",
        parentId: "2",
        topRow: 6,
        bottomRow: 18,
        widgetName: "four",
        skipForFormWidget: "test",
        value: "test",
        isDirty: true,
        isValid: true,
      },
      meta_one: {
        skipForFormWidget: "test",
        children: ["1_meta"],
        type: "CANVAS",
        widgetId: "1_meta",
        parentId: "2",
        topRow: 0,
        bottomRow: 100,
        widgetName: "meta_one",
      },
      meta_two: {
        children: [],
        type: "INPUT_WIDGET",
        widgetId: "meta_two",
        parentId: "meta_1",
        topRow: 0,
        bottomRow: 10,
        widgetName: "two",
        skipForFormWidget: "test",
        value: "test",
        isDirty: true,
        isValid: true,
      },
    } as unknown as DataTree;

    it("should return a complete childwidgets Tree", () => {
      const childWidgetTree = [
        {
          bottomRow: 5,
          children: [],
          skipForFormWidget: "test",
          isDirty: true,
          isLoading: false,
          isValid: true,
          parentId: "2",
          topRow: 4,
          type: "TEXT",
          value: "test",
          widgetId: "3",
          widgetName: "three",
        },
        {
          bottomRow: 18,
          children: [],
          skipForFormWidget: "test",
          isDirty: true,
          isLoading: false,
          isValid: true,
          parentId: "2",
          topRow: 6,
          type: "BUTTON",
          value: "test",
          widgetId: "4",
          widgetName: "four",
        },
        {
          type: "CANVAS",
          isLoading: false,
          widgetId: "1_meta",
          parentId: "2",
          topRow: 0,
          bottomRow: 100,
          widgetName: "meta_one",
          skipForFormWidget: "test",
          children: [
            {
              isDirty: true,
              isLoading: false,
              isValid: true,
              value: "test",
              children: [],
              type: "INPUT_WIDGET",
              widgetId: "2_meta",
              parentId: "1_meta",
              topRow: 0,
              bottomRow: 10,
              widgetName: "meta_two",
              skipForFormWidget: "test",
            },
          ],
        },
      ];

      expect(
        buildChildWidgetTree(
          canvasWidgets,
          metaWidgets,
          dataTree,
          new Set<string>("one"),
          {},
          "2",
        ),
      ).toEqual(childWidgetTree);
    });

    it("should return a partial childwidgets Tree with properties specified", () => {
      const childWidgetTree = [
        {
          bottomRow: 100,
          children: [
            {
              bottomRow: 5,
              children: [],
              isDirty: true,
              isLoading: false,
              isValid: true,
              parentId: "2",
              topRow: 4,
              type: "TEXT",
              value: "test",
              widgetId: "3",
              widgetName: "three",
            },
            {
              bottomRow: 18,
              children: [],
              isDirty: true,
              isLoading: false,
              isValid: true,
              parentId: "2",
              topRow: 6,
              type: "BUTTON",
              value: "test",
              widgetId: "4",
              widgetName: "four",
            },
            {
              isLoading: false,
              parentId: "2",
              topRow: 0,
              type: "CANVAS",
              widgetId: "1_meta",
              bottomRow: 100,
              widgetName: "meta_one",
              children: [
                {
                  isDirty: true,
                  isLoading: false,
                  isValid: true,
                  value: "test",
                  children: [],
                  type: "INPUT_WIDGET",
                  widgetId: "2_meta",
                  parentId: "1_meta",
                  topRow: 0,
                  bottomRow: 10,
                  widgetName: "meta_two",
                },
              ],
            },
          ],
          isDirty: true,
          isLoading: false,
          isValid: true,
          parentId: "1",
          topRow: 0,
          type: "CANVAS",
          value: "test",
          widgetId: "2",
          widgetName: "two",
        },
      ];

      expect(
        buildChildWidgetTree(
          canvasWidgets,
          metaWidgets,
          dataTree,
          new Set<string>("two"),
          {},
          "1",
        ),
      ).toEqual(childWidgetTree);
    });

    it("should return a partial childwidgets Tree with just loading widgets", () => {
      const childWidgetTree = [
        {
          ENTITY_TYPE: "WIDGET",
          bindingPaths: {},
          bottomRow: 100,
          children: [
            {
              ENTITY_TYPE: "WIDGET",
              bindingPaths: {},
              bottomRow: 5,
              children: [],
              isLoading: false,
              logBlackList: {},
              meta: {},
              overridingPropertyPaths: {},
              parentId: "2",
              privateWidgets: {},
              propertyOverrideDependency: {},
              reactivePaths: {},
              topRow: 4,
              triggerPaths: {},
              type: "SKELETON_WIDGET",
              validationPaths: {},
              widgetId: "3",
              widgetName: "three",
            },
            {
              ENTITY_TYPE: "WIDGET",
              bindingPaths: {},
              bottomRow: 18,
              children: [],
              isLoading: false,
              logBlackList: {},
              meta: {},
              overridingPropertyPaths: {},
              parentId: "2",
              privateWidgets: {},
              propertyOverrideDependency: {},
              reactivePaths: {},
              topRow: 6,
              triggerPaths: {},
              type: "SKELETON_WIDGET",
              validationPaths: {},
              widgetId: "4",
              widgetName: "four",
            },
            {
              ENTITY_TYPE: "WIDGET",
              bindingPaths: {},
              bottomRow: 100,
              isLoading: false,
              logBlackList: {},
              meta: {},
              overridingPropertyPaths: {},
              parentId: "2",
              privateWidgets: {},
              propertyOverrideDependency: {},
              reactivePaths: {},
              topRow: 0,
              triggerPaths: {},
              type: "SKELETON_WIDGET",
              validationPaths: {},
              widgetId: "1_meta",
              widgetName: "meta_one",
              children: [
                {
                  ENTITY_TYPE: "WIDGET",
                  bindingPaths: {},
                  bottomRow: 10,
                  children: [],
                  isLoading: false,
                  logBlackList: {},
                  meta: {},
                  overridingPropertyPaths: {},
                  parentId: "1_meta",
                  privateWidgets: {},
                  propertyOverrideDependency: {},
                  reactivePaths: {},
                  topRow: 0,
                  triggerPaths: {},
                  type: "SKELETON_WIDGET",
                  validationPaths: {},
                  widgetId: "2_meta",
                  widgetName: "meta_two",
                },
              ],
            },
          ],
          isLoading: false,
          logBlackList: {},
          meta: {},
          overridingPropertyPaths: {},
          parentId: "1",
          privateWidgets: {},
          propertyOverrideDependency: {},
          reactivePaths: {},
          topRow: 0,
          triggerPaths: {},
          type: "SKELETON_WIDGET",
          validationPaths: {},
          widgetId: "2",
          widgetName: "two",
        },
      ];

      expect(
        buildChildWidgetTree(
          canvasWidgets,
          metaWidgets,
          {},
          new Set<string>("one"),
          {},
          "1",
        ),
      ).toEqual(childWidgetTree);
    });
  });
});
