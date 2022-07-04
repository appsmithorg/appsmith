import { Severity, ENTITY_TYPE } from "entities/AppsmithConsole";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { getFilteredErrors } from "./debuggerSelectors";

describe("getFilteredErrors", () => {
  it("hides error from hidden widget in main canvas", () => {
    const TestData = {
      debuggerErrors: {
        "main_input_id-defaultText": {
          id: "main_input_id-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "main_input_id",
            name: "main_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        main_input_id: {
          widgetName: "main_input",
          type: "INPUT_WIDGET_V2",
          widgetId: "main_input_id",
          parentId: "0",
        },
      },
      dataTree: {
        main_input: {
          isVisible: false,
          parentId: "0",
          widgetId: "main_input_id",
          type: "INPUT_WIDGET_V2",
          ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error from widget in closed modal", () => {
    const TestData = {
      debuggerErrors: {
        "modal_input-defaultText": {
          id: "modal_input-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "modal_input",
            name: "ModalInput",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        modal_input: {
          widgetName: "ModalInput",
          type: "INPUT_WIDGET_V2",
          widgetId: "modal_input",
          parentId: "modal_canvas_id",
        },
        modal_canvas_id: {
          widgetName: "ModalCanvas",
          type: "CANVAS_WIDGET",
          widgetId: "modal_canvas_id",
          parentId: "modal1_id",
        },
        modal1_id: {
          widgetName: "Modal1",
          type: "MODAL_WIDGET",
          widgetId: "modal1_id",
          parentId: "0",
        },
      },
      dataTree: {
        ModalInput: {
          isVisible: true,
          parentId: "modal_canvas_id",
          widgetId: "modal_input",
          type: "INPUT_WIDGET_V2",
          ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        },
        ModalCanvas: {
          isVisible: true,
          type: "CANVAS_WIDGET",
          widgetId: "modal_canvas_id",
          parentId: "modal1_id",
          ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        },
        Modal1: {
          isVisible: false,
          type: "MODAL_WIDGET",
          widgetId: "modal1_id",
          parentId: "0",
          ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error from widget in non-active tab", () => {
    const TestData = {
      debuggerErrors: {
        "tab2_input-defaultText": {
          id: "tab2_input-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "tab2_input",
            name: "Tab2Input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        tab1_id: {
          tabId: "tab1",
          widgetName: "Tab1Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          parentId: "tabs_widget_id",
        },
        tab2_input: {
          widgetName: "Tab2Input",
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          parentId: "tab2_id",
        },
        tab2_id: {
          tabId: "tab2",
          widgetName: "Tab2Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          parentId: "tabs_widget_id",
        },
        tabs_widget_id: {
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "0",
        },
      },
      dataTree: {
        Tab1Canvas: {
          tabId: "tab1",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          isVisible: true,
          parentId: "tab2_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Canvas: {
          tabId: "tab2",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tabs1: {
          isVisible: true,
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "0",
          selectedTab: "Tab 1",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error from widget in active tab (hidden tab widget)", () => {
    const TestData = {
      debuggerErrors: {
        "tab2_input-defaultText": {
          id: "tab2_input-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "tab2_input",
            name: "Tab2Input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        tab1_id: {
          tabId: "tab1",
          widgetName: "Tab1Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          parentId: "tabs_widget_id",
        },
        tab2_input: {
          widgetName: "Tab2Input",
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          parentId: "tab2_id",
        },
        tab2_id: {
          tabId: "tab2",
          widgetName: "Tab2Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          parentId: "tabs_widget_id",
        },
        tabs_widget_id: {
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "0",
        },
      },
      dataTree: {
        Tab1Canvas: {
          tabId: "tab1",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          isVisible: true,
          parentId: "tab2_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Canvas: {
          tabId: "tab2",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tabs1: {
          isVisible: false,
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "0",
          selectedTab: "Tab 2",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error from widget in active tab (tab widget inside hidden container)", () => {
    const TestData = {
      debuggerErrors: {
        "tab2_input-defaultText": {
          id: "tab2_input-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "tab2_input",
            name: "Tab2Input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        tab1_id: {
          tabId: "tab1",
          widgetName: "Tab1Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          parentId: "tabs_widget_id",
        },
        tab2_input: {
          widgetName: "Tab2Input",
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          parentId: "tab2_id",
        },
        tab2_id: {
          tabId: "tab2",
          widgetName: "Tab2Canvas",
          type: "CANVAS_WIDGET",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          parentId: "tabs_widget_id",
        },
        tabs_widget_id: {
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "canvas_widget_id",
        },
        canvas_widget_id: {
          widgetName: "ContainerCanvas",
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          parentId: "container1_id",
        },
        container1_id: {
          widgetName: "Container1",
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          parentId: "0",
        },
      },
      dataTree: {
        Tab1Canvas: {
          tabId: "tab1",
          type: "CANVAS_WIDGET",
          tabName: "Tab 1",
          widgetId: "tab1_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "tab2_input",
          isVisible: true,
          parentId: "tab2_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tab2Canvas: {
          tabId: "tab2",
          tabName: "Tab 2",
          widgetId: "tab2_id",
          isVisible: true,
          parentId: "tabs_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        Tabs1: {
          isVisible: true,
          widgetName: "Tabs1",
          type: "TABS_WIDGET",
          widgetId: "tabs_widget_id",
          defaultTab: "Tab 1",
          parentId: "canvas_widget_id",
          selectedTab: "Tab 2",
          ENTITY_TYPE: "WIDGET",
        },
        ContainerCanvas: {
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          isVisible: true,
          parentId: "container1_id",
          ENTITY_TYPE: "WIDGET",
        },
        Container1: {
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          isVisible: false,
          parentId: "0",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error from widget in hidden container", () => {
    const TestData = {
      debuggerErrors: {
        "container1_input_id-defaultText": {
          id: "container1_input_id-defaultText",
          logType: 5,
          text: "The value at defaultText is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "container1_input_id",
            name: "container1_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "defaultText",
          },
          state: {
            defaultText: "",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        container1_input_id: {
          widgetName: "container1_input",
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          parentId: "canvas_widget_id",
        },
        canvas_widget_id: {
          widgetName: "ContainerCanvas",
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          parentId: "container1_id",
        },
        container1_id: {
          widgetName: "Container1",
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          parentId: "0",
        },
      },
      dataTree: {
        container1_input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          isVisible: true,
          parentId: "canvas_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        ContainerCanvas: {
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          isVisible: true,
          parentId: "container1_id",
          ENTITY_TYPE: "WIDGET",
        },
        Container1: {
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          isVisible: false,
          parentId: "0",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("shows error for widget with faulty binding for isVisible prop", () => {
    const TestData = {
      debuggerErrors: {
        "main_input_id-isVisible": {
          id: "main_input_id-isVisible",
          logType: 5,
          text: "The value at isVisible is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "main_input_id",
            name: "main_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "isVisible",
          },
          state: {
            isVisible: "{{users}}",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        main_input_id: {
          widgetName: "main_input",
          type: "INPUT_WIDGET_V2",
          widgetId: "main_input_id",
          parentId: "0",
        },
      },
      dataTree: {
        main_input: {
          isVisible: false,
          parentId: "0",
          widgetId: "main_input_id",
          type: "INPUT_WIDGET_V2",
          ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        },
      },
      expectedResult: {
        "main_input_id-isVisible": {
          id: "main_input_id-isVisible",
          logType: 5,
          text: "The value at isVisible is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "main_input_id",
            name: "main_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "isVisible",
          },
          state: {
            isVisible: "{{users}}",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("shows error for widget with faulty binding for isVisible prop (visible parent container)", () => {
    const TestData = {
      debuggerErrors: {
        "container1_input_id-isVisible": {
          id: "container1_input_id-isVisible",
          logType: 5,
          text: "The value at isVisible is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "container1_input_id",
            name: "container1_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "isVisible",
          },
          state: {
            isVisible: "{{users}}",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        container1_input_id: {
          widgetName: "container1_input",
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          parentId: "canvas_widget_id",
        },
        canvas_widget_id: {
          widgetName: "ContainerCanvas",
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          parentId: "container1_id",
        },
        container1_id: {
          widgetName: "Container1",
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          parentId: "0",
        },
      },
      dataTree: {
        container1_input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          isVisible: false,
          parentId: "canvas_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        ContainerCanvas: {
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          isVisible: true,
          parentId: "container1_id",
          ENTITY_TYPE: "WIDGET",
        },
        Container1: {
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          isVisible: true,
          parentId: "0",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {
        "container1_input_id-isVisible": {
          id: "container1_input_id-isVisible",
          logType: 5,
          text: "The value at isVisible is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "container1_input_id",
            name: "container1_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "isVisible",
          },
          state: {
            isVisible: "{{users}}",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });

  it("hides error for widget with faulty binding for isVisible prop (hidden parent container)", () => {
    const TestData = {
      debuggerErrors: {
        "container1_input_id-isVisible": {
          id: "container1_input_id-isVisible",
          logType: 5,
          text: "The value at isVisible is invalid",
          messages: [
            {
              message:
                "TypeError: Cannot read properties of undefined (reading 'users')",
              type: PropertyEvaluationErrorType.PARSE,
            },
          ],
          source: {
            id: "container1_input_id",
            name: "container1_input",
            type: ENTITY_TYPE.WIDGET,
            propertyPath: "isVisible",
          },
          state: {
            isVisible: "{{users}}",
          },
          analytics: {
            widgetType: "INPUT_WIDGET_V2",
          },
          severity: Severity.ERROR,
          timestamp: "02:40:10",
        },
      },
      canvasWidgets: {
        container1_input_id: {
          widgetName: "container1_input",
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          parentId: "canvas_widget_id",
        },
        canvas_widget_id: {
          widgetName: "ContainerCanvas",
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          parentId: "container1_id",
        },
        container1_id: {
          widgetName: "Container1",
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          parentId: "0",
        },
      },
      dataTree: {
        container1_input: {
          type: "INPUT_WIDGET_V2",
          widgetId: "container1_input_id",
          isVisible: false,
          parentId: "canvas_widget_id",
          ENTITY_TYPE: "WIDGET",
        },
        ContainerCanvas: {
          type: "CANVAS_WIDGET",
          widgetId: "canvas_widget_id",
          isVisible: true,
          parentId: "container1_id",
          ENTITY_TYPE: "WIDGET",
        },
        Container1: {
          type: "CONTAINER_WIDGET",
          widgetId: "container1_id",
          isVisible: false,
          parentId: "0",
          ENTITY_TYPE: "WIDGET",
        },
      },
      expectedResult: {},
    };
    const result = getFilteredErrors.resultFunc(
      TestData.debuggerErrors,
      false,
      (TestData.canvasWidgets as unknown) as CanvasWidgetsReduxState,
      (TestData.dataTree as unknown) as DataTree,
    );
    expect(result).toStrictEqual(TestData.expectedResult);
  });
});
