const updateAndSaveLayoutMock = jest.fn();
const updateAndSaveAnvilLayoutMock = jest.fn();
import {
  setWidgetDynamicPropertySaga,
  removeDynamicBindingProperties,
  handleUpdateWidgetDynamicProperty,
  batchUpdateWidgetDynamicPropertySaga,
  duplicateTabChildrensSaga,
} from "./WidgetOperationSagas";

const widget = {
  isVisible: "true",
  dynamicPropertyPathList: [],
  dynamicBindingPathList: [],
};

const widget1 = {
  isVisible: "{{true}}",
  dynamicPropertyPathList: [
    {
      key: "isVisible",
    },
  ],
  dynamicBindingPathList: [
    {
      key: "isVisible",
    },
  ],
};

const mockCanvassWidgets = {
  tabs1234: {
    widgetName: "Tabs1",
    widgetId: "tabs1234",
    parentId: "canvas1234",
    children: ["tab1234", "tab1235"],
    tabsObj: {
      Tab1: {
        label: "Tab1",
        widgetId: "tab1234",
        isVisible: true,
        index: 0,
        parentId: "tabs1234",
        id: "Tab1",
      },
      Tab2: {
        label: "Tab2",
        widgetId: "tab1235",
        isVisible: true,
        index: 1,
        parentId: "tabs1234",
        id: "Tab2",
      },
    },
    id: "Tabs1",
  },
  tab1234: {
    widgetName: "Tab1",
    widgetId: "tab1234",
    widgetType: "TAB_WIDGET",
    children: ["button1234"],
    parentId: "tabs1234",
    id: "Tab1",
  },
  tab1235: {
    widgetName: "Tab2",
    widgetType: "TAB_WIDGET",
    widgetId: "tab1235",
    children: [],
    parentId: "tabs1234",
    id: "Tab2",
  },
  button1234: {
    widgetName: "Button",
    widgetId: "button1234",
    parentId: "tab1234",
    widgetType: "BUTTON_WIDGET",
    id: "Button1",
  },
};
const evalMockTree = {
  Tabs1: {
    widgetName: "Tabs1",
    widgetId: "tabs1234",
    parentId: "canvas1234",
    children: ["tab1234", "tab1235"],
    tabsObj: {
      Tab1: {
        label: "Tab1",
        widgetId: "tab1234",
        isVisible: true,
        index: 0,
        parentId: "tabs1234",
        id: "Tab1",
      },
      Tab2: {
        label: "Tab2",
        widgetId: "tab1235",
        isVisible: true,
        index: 1,
        parentId: "tabs1234",
        id: "Tab2",
      },
    },
    id: "Tabs1",
  },
  Button1: {
    widgetName: "Button",
    widgetId: "button1234",
    parentId: "tab1234",
    widgetType: "BUTTON_WIDGET",
    id: "Button1",
  },
};

jest.mock("redux-saga/effects", () => {
  const originalModule = jest.requireActual("redux-saga/effects");

  return {
    __esModule: true,
    ...originalModule,
    select: jest.fn(),
    call: jest.fn(),
    put: jest.fn(),
  };
});

jest.mock("actions/pageActions", () => {
  const originalModule = jest.requireActual("actions/pageActions");

  return {
    __esModule: true,
    ...originalModule,
    updateAndSaveLayout: updateAndSaveLayoutMock,
    updateAndSaveAnvilLayout: updateAndSaveAnvilLayoutMock,
  };
});

describe("WidgetOperationSaga - ", () => {
  describe("Should test setWidgetDynamicPropertySaga ", () => {
    it("should update dynamicBindingPathList on js toggle", () => {
      const value = setWidgetDynamicPropertySaga({
        type: "test",
        payload: {
          isDynamic: true,
          propertyPath: "isVisible",
          widgetId: "test",
        },
      });

      value.next(); // start
      value.next(widget as any); // yield select
      value.next({
        ...widget,
        dynamicPropertyPathList: [
          {
            key: "isVisible",
          },
        ],
      } as any);
      value.next({
        test: widget,
      } as any); // yield select
      value.next(); //yield put
      expect(updateAndSaveLayoutMock).toHaveBeenCalledWith({
        test: {
          ...widget,
          dynamicPropertyPathList: [
            {
              key: "isVisible",
            },
          ],
        },
      });
    });

    it("should remove property from dynamicBindingList on js toggle off", () => {
      const value = setWidgetDynamicPropertySaga({
        type: "test",
        payload: {
          isDynamic: false,
          propertyPath: "isVisible",
          widgetId: "test",
        },
      });
      value.next(); // start
      value.next(widget1 as any); // yield select
      value.next({
        ...widget1,
        dynamicPropertyPathList: [],
        dynamicBindingPathList: [],
        isVisible: 1,
      } as any);
      value.next({
        test: widget1,
      } as any); // yield select
      value.next(); //yield put
      expect(updateAndSaveLayoutMock).toHaveBeenCalledWith({
        test: {
          dynamicPropertyPathList: [],
          dynamicBindingPathList: [],
          isVisible: 1,
        },
      });
    });
  });
});

describe("Should test handleUpdateWidgetDynamicProperty ", () => {
  it("should update dynamicBindingPathList on js toggle and return the widget with dynamicBindingPath", () => {
    const value = handleUpdateWidgetDynamicProperty(widget as any, {
      isDynamic: true,
      propertyPath: "isVisible",
    });
    value.next(); // start
    value.next(widget as any); // yield select
    value.next({
      test: widget,
    } as any); // yield select
    value.return({
      test: {
        ...widget,
        dynamicPropertyPathList: [
          {
            key: "isVisible",
          },
        ],
      },
    } as any);
    expect(value.next().done).toEqual(true);
  });
});

describe("Should test batchUpdateWidgetDynamicPropertySaga ", () => {
  it("should update dynamicBindingPathList on js toggle and return the widget with dynamicBindingPath", () => {
    const value = batchUpdateWidgetDynamicPropertySaga({
      type: "test",
      payload: {
        updates: [
          {
            isDynamic: true,
            propertyPath: "isVisible",
          },
        ],
        widgetId: "test",
      },
    });
    value.next(); // start
    value.next(widget as any); // yield select
    value.next({
      ...widget,
      dynamicPropertyPathList: [
        {
          key: "isVisible",
        },
      ],
    } as any);
    value.next({
      test: widget,
    } as any); // yield select
    value.next(); //yield put
    expect(updateAndSaveLayoutMock).toHaveBeenCalledWith({
      test: {
        ...widget,
        dynamicPropertyPathList: [
          {
            key: "isVisible",
          },
        ],
      },
    });
  });
  it("should remove property from dynamicBindingList on js toggle off when calling batchUpdateWidgetDynamicPropertySaga", () => {
    const value = batchUpdateWidgetDynamicPropertySaga({
      type: "test",
      payload: {
        updates: [
          {
            isDynamic: false,
            propertyPath: "isVisible",
          },
        ],
        widgetId: "test",
      },
    });
    value.next(); // start
    value.next(widget1 as any); // yield select
    value.next({
      ...widget1,
      dynamicPropertyPathList: [],
      dynamicBindingPathList: [],
      isVisible: 1,
    } as any);
    value.next({
      test: widget1,
    } as any); // yield select
    value.next(); //yield put
    expect(updateAndSaveLayoutMock).toHaveBeenCalledWith({
      test: {
        dynamicPropertyPathList: [],
        dynamicBindingPathList: [],
        isVisible: 1,
      },
    });
  });
});

describe("test removeDynamicBindingList", () => {
  it("should remove table derived binding properties", () => {
    // table bindings with derived properties
    const dynamicBindingList = [
      { key: "primaryColumns.step.computedValue" },
      { key: "primaryColumns.task.computedValue" },
      { key: "primaryColumns.status.computedValue" },
      { key: "primaryColumns.action.computedValue" },
      { key: "derivedColumns.customColumn1.isCellVisible" },
      { key: "primaryColumns.customColumn1.isCellVisible" },
    ];
    const propertyPath = "primaryColumns.customColumn1.isCellVisible";
    const dynamicProperties = removeDynamicBindingProperties(
      propertyPath,
      dynamicBindingList,
    );

    // should remove custom and derived properties for customColumn1.isCellVisible
    expect(dynamicProperties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "derivedColumns.customColumn1.isCellVisible",
        }),
        expect.objectContaining({
          key: "primaryColumns.customColumn1.isCellVisible",
        }),
      ]),
    );
  });

  it("should remove table binding properties", () => {
    // table bindings
    const dynamicBindingList = [
      { key: "primaryColumns.step.computedValue" },
      { key: "primaryColumns.task.computedValue" },
      { key: "primaryColumns.status.computedValue" },
      { key: "primaryColumns.action.computedValue" },
      { key: "primaryColumns.action.buttonLabel" },
    ];

    const propertyPath = "primaryColumns.action.buttonLabel";

    const dynamicProperties = removeDynamicBindingProperties(
      propertyPath,
      dynamicBindingList,
    );

    // should remove primaryColumns.action.buttonLabel property
    expect(dynamicProperties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "primaryColumns.action.buttonLabel",
        }),
      ]),
    );
  });

  it("should remove widget properties", () => {
    // button widget binding
    const dynamicBindingList = [{ key: "isVisible" }];

    const propertyPath = "isVisible";
    const dynamicProperties = removeDynamicBindingProperties(
      propertyPath,
      dynamicBindingList,
    );

    // should remove the isVisible property
    expect(dynamicProperties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "isVisible",
        }),
      ]),
    );
  });
});

describe("Testing duplicateTabChildrensSaga", () => {
  it("should duplicate tab children", () => {
    const gen = duplicateTabChildrensSaga({
      type: "DUPLICATE_TAB_CHILDREN",
      payload: {
        tabsWidgetId: "tabs1234",
        duplicatedTabIndex: 0,
      },
    });

    gen.next(); // yield select(getWidgets)
    gen.next(mockCanvassWidgets as any); // yield select(getWidget, "tabs1234")
    gen.next(mockCanvassWidgets.tabs1234 as any); // yield call(duplicateTabChildren, mockCanvassWidgets, "tabs1234", 0)
    gen.next(evalMockTree as any); // yield select(getDataTree)
    gen.next(); // yield put(updateAndSaveAnvilLayout())
    expect(updateAndSaveLayoutMock).toBeCalled();
  });
});