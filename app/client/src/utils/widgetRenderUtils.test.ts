import { DataTree } from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { buildChildWidgetTree } from "./widgetRenderUtils";

describe("test EditorUtils methods", () => {
  describe("should test buildChildWidgetTree method", () => {
    const canvasWidgets = ({
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
        children: ["3", "4"],
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
    } as unknown) as CanvasWidgetsReduxState;

    const dataTree = ({
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
        children: ["3", "4"],
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
    } as unknown) as DataTree;

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
      ];

      expect(
        buildChildWidgetTree(
          canvasWidgets,
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
              type: undefined,
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
              type: undefined,
              validationPaths: {},
              widgetId: "4",
              widgetName: "four",
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
          type: undefined,
          validationPaths: {},
          widgetId: "2",
          widgetName: "two",
        },
      ];
      expect(
        buildChildWidgetTree(
          canvasWidgets,
          {},
          new Set<string>("one"),
          {},
          "1",
        ),
      ).toEqual(childWidgetTree);
    });
  });
});
