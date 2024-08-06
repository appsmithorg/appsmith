import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import reducer, {
  initialState as reducerInitialState,
} from "./canvasWidgetsReducer";

describe("Canvas Widgets Reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "", payload: "" })).toEqual({});
  });

  it("should update the paths", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
        },
      },
    };
    const type = ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES;
    const payload = {
      widgetsToUpdate: {
        xyz123: [
          {
            propertyPath: "someValue.apple",
            propertyValue: "apple",
          },
        ],
      },
      shouldEval: false,
    };
    const expected = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "apple",
        },
      },
    };

    expect(reducer(initialState, { type, payload })).toEqual(expected);
  });

  it("should create paths if they donot exist", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
        },
      },
    };
    const type = ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES;
    const payload = {
      widgetsToUpdate: {
        xyz123: [
          {
            propertyPath: "someValue.games.ball",
            propertyValue: ["football"],
          },
        ],
      },
      shouldEval: false,
    };
    const expected = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
          games: {
            ball: ["football"],
          },
        },
      },
    };

    expect(reducer(initialState, { type, payload })).toEqual(expected);
  });

  it("should not update the paths if the values are the same", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
        },
      },
    };
    const type = ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES;
    const payload = {
      widgetsToUpdate: {
        xyz123: [
          {
            propertyPath: "someValue.apple",
            propertyValue: "orange",
          },
        ],
      },
      shouldEval: false,
    };

    // Reference equality check using toBe
    expect(reducer(initialState, { type, payload })).toBe(initialState);
  });

  it("should have the same reference for paths not updated", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
          games: {
            ball: ["football"],
          },
        },
      },
    };
    const type = ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES;
    const payload = {
      widgetsToUpdate: {
        xyz123: [
          {
            propertyPath: "someValue.apple",
            propertyValue: "orange",
          },
        ],
      },
      shouldEval: true,
    };

    const result = reducer(initialState, { type, payload }).xyz123.someValue
      .games;

    // Reference equality check using toBe
    expect(result).toBe(initialState.xyz123.someValue.games);
  });

  it("should reset to initial state on RESET_EDITOR_REQUEST", () => {
    const initialState = {
      "0": { children: ["xyz123"] },
      xyz123: {
        bottomRow: 20,
        topRow: 10,
        someValue: {
          apple: "orange",
          games: {
            ball: ["football"],
          },
        },
      },
    };

    const result = reducer(initialState, {
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
      payload: undefined,
    });

    expect(result).toStrictEqual(reducerInitialState);
  });
});
