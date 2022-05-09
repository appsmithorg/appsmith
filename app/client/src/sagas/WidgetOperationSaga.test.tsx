import { setWidgetDynamicPropertySaga } from "./WidgetOperationSagas";
import { updateAndSaveLayout } from "actions/pageActions";

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
    updateAndSaveLayout: jest.fn(),
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
      expect(updateAndSaveLayout).toHaveBeenCalledWith({
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
      expect(updateAndSaveLayout).toHaveBeenCalledWith({
        test: {
          dynamicPropertyPathList: [],
          dynamicBindingPathList: [],
          isVisible: 1,
        },
      });
    });
  });
});
