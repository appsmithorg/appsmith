import metaReducer, { initialState } from "./index";
import { updateMetaState } from "actions/metaActions";
import { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

let previousState = initialState;

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
  expect(metaReducer(undefined, noAction())).toEqual(previousState);
});

test("Add a widget meta values", () => {
  previousState = initialState;
  expect(
    metaReducer(previousState, {
      type: ReduxActionTypes.SET_META_PROP,
      payload: {
        widgetId: inputWidget.widgetId,
        propertyName: inputWidget.propertyName,
        propertyValue: inputWidget.propertyValue,
      },
    }),
  ).toEqual({
    incwlne: {
      text: "test",
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
  expect(metaReducer(previousState, updateMetaState(evalMetaUpdates))).toEqual({
    incwlne: {
      text: "test123",
      selectedValues: ["YELLOW"],
    },
  });
});
