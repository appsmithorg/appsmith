import metaReducer, { initialState } from "./index";
import { updateMetaState } from "actions/metaActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

let currentMetaState = initialState;

const inputWidget = {
  widgetId: "incwlne",
  propertyName: "selectedValues",
  propertyValue: ["GREEN", "BLUE", "YELLOW"],
};

const noAction = (): ReduxAction<unknown> => {
  return {
    type: "NO_ACTION",
    payload: {},
  };
};

test("should return the initial state", () => {
  expect(metaReducer(undefined, noAction())).toEqual(currentMetaState);
});

test("Add a widget meta values", () => {
  currentMetaState = initialState;
  expect(
    metaReducer(currentMetaState, {
      type: ReduxActionTypes.SET_META_PROP,
      payload: {
        widgetId: inputWidget.widgetId,
        propertyName: inputWidget.propertyName,
        propertyValue: inputWidget.propertyValue,
      },
    }),
  ).toEqual({
    incwlne: {
      selectedValues: ["GREEN", "BLUE", "YELLOW"],
    },
  });
});

test("Update widget meta state using evalMetaUpdates", () => {
  const evalMetaUpdates = [
    { widgetId: "incwlne", metaPropertyPath: ["text"], value: "test123" },
    {
      widgetId: "incwlne",
      metaPropertyPath: ["selectedValues"],
      value: ["YELLOW"],
    },
  ];
  currentMetaState = metaReducer(
    currentMetaState,
    updateMetaState(evalMetaUpdates),
  );
  expect(currentMetaState).toEqual({
    incwlne: {
      text: "test123",
      selectedValues: ["YELLOW"],
    },
  });
});

describe("Reset widget meta action", () => {
  test("Reset widget with only widgetId", () => {
    currentMetaState = metaReducer(currentMetaState, {
      type: ReduxActionTypes.RESET_WIDGET_META,
      payload: {
        widgetId: inputWidget.widgetId,
      },
    });
    expect(currentMetaState).toEqual({
      incwlne: {},
    });
  });

  currentMetaState = initialState;
  expect(
    metaReducer(currentMetaState, {
      type: ReduxActionTypes.SET_META_PROP,
      payload: {
        widgetId: inputWidget.widgetId,
        propertyName: inputWidget.propertyName,
        propertyValue: inputWidget.propertyValue,
      },
    }),
  ).toEqual({
    incwlne: {
      selectedValues: ["GREEN", "BLUE", "YELLOW"],
    },
  });

  test("Reset widget with evaluated values", () => {
    expect(
      metaReducer(currentMetaState, {
        type: ReduxActionTypes.RESET_WIDGET_META,
        payload: {
          widgetId: inputWidget.widgetId,
          evaluatedWidget: {
            defaultSelectedValues: ["GREEN"],
            selectedValues: ["GREEN", "BLUE", "YELLOW"],
            widgetId: inputWidget.widgetId,
            propertyOverrideDependency: {
              selectedValues: {
                DEFAULT: "defaultSelectedValues",
                META: "meta.selectedValues",
              },
            },
          },
        },
      }),
    ).toEqual({
      incwlne: {
        selectedValues: ["GREEN"],
      },
    });
  });
});
