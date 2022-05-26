const updateAndSaveLayoutMock = jest.fn();

import {
  setWidgetDynamicPropertySaga,
  removeDynamicBindingProperties,
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
      value.next({ parsed: 1 } as any); // yield call
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
