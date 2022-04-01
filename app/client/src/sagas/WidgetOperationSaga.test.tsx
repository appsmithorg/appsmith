import { WidgetProps } from "widgets/BaseWidget";
import { setWidgetDynamicPropertySaga } from "./WidgetOperationSagas";

const widget = {
  label: "{{test}}",
  dynamicPropertyPathList: [],
  dynamicBindingPathList: [],
};

const widget1 = {
  label: "{{test}}",
  dynamicPropertyPathList: [
    {
      key: "label",
    },
  ],
  dynamicBindingPathList: [
    {
      key: "label",
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

let updateAndSaveLayoutMock: any;

jest.mock("actions/pageActions", () => {
  const originalModule = jest.requireActual("actions/pageActions");
  updateAndSaveLayoutMock = jest.fn();

  return {
    __esModule: true,
    ...originalModule,
    updateAndSaveLayout: updateAndSaveLayoutMock,
  };
});

describe("WidgetOperationSaga - ", () => {
  describe("Shoudld test setWidgetDynamicPropertySaga ", () => {
    it("that its updating the dyncamicBindingPathList peroperly", () => {
      let value = setWidgetDynamicPropertySaga({
        type: "test",
        payload: {
          isDynamic: true,
          propertyPath: "label",
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
              key: "label",
            },
          ],
        },
      });

      value = setWidgetDynamicPropertySaga({
        type: "test",
        payload: {
          isDynamic: false,
          propertyPath: "label",
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
          label: 1,
        },
      });
    });
  });
});
