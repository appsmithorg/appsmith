const updateWidgetNameSuccessMock = jest.fn();
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { updateWidgetNameSaga } from "./PageSagas";

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
    updateWidgetNameSuccess: updateWidgetNameSuccessMock,
  };
});
jest.mock("./PageSagas", () => {
  const originalModule = jest.requireActual("./PageSagas");
  return {
    __esModule: true,
    ...originalModule,
    updateCanvasWithDSL: jest.fn(),
  };
});
jest.mock("sagas/ErrorSagas", () => {
  const originalModule = jest.requireActual("sagas/ErrorSagas");

  return {
    __esModule: true,
    ...originalModule,
    validateResponse: jest.fn(),
  };
});
jest.mock("sagas/helper", () => {
  const originalModule = jest.requireActual("sagas/helper");

  return {
    __esModule: true,
    ...originalModule,
    checkAndLogErrorsIfCyclicDependency: jest.fn(),
  };
});
const mockCanvasWidgets = {
  checkBox1: {
    widgetName: "checkbox1",
    type: "CHECKBOX_WIDGET",
    widgetId: "checkBox1",
    parentId: "canvas1",
  },
  button1234: {
    widgetName: "Button",
    widgetId: "button1234",
    parentId: "canvas1",
    widgetType: "BUTTON_WIDGET",
    id: "Button1",
  },
};
const mockUsedNames = {
  get_users: true,
  Button: true,
  checkbox1: true,
  canvas1: true,
};

describe("PageSagas", () => {
  it("test updateWidgetNameSaga with name that starts with a number", () => {
    const gen = updateWidgetNameSaga({
      type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
      payload: { id: "checkBox1", newName: "1checkbox" },
    });
    gen.next();
    gen.next(mockCanvasWidgets.checkBox1 as never);
    gen.next("layoutId1" as never);
    gen.next("pageId1" as never);
    gen.next(mockUsedNames as never);
    gen.next(undefined as never);
    expect(gen.next().done).toBeTruthy();
  });
  it("test updateWidgetNameSaga with name that is valid", () => {
    const gen = updateWidgetNameSaga({
      type: ReduxActionTypes.UPDATE_WIDGET_NAME_INIT,
      payload: { id: "checkBox1", newName: "checkBox10" },
    });
    gen.next();
    gen.next(mockCanvasWidgets.checkBox1 as never);
    gen.next("layoutId1" as never);
    gen.next("pageId1" as never);
    gen.next(mockUsedNames as never);
    gen.next(undefined as never);
    gen.next({ data: "mock" } as never);
    gen.next(true as never);
    gen.next();
    gen.next();
    expect(gen.next().done).toBeTruthy();
    expect(updateWidgetNameSuccessMock).toBeCalled();
  });
});
