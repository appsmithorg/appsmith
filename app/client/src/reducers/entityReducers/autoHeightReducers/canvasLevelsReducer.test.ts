import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import reducer from "./canvasLevelsReducer";
import type { CanvasLevelsReduxState } from "./canvasLevelsReducer.types";

describe("Canvas Levels Reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "", payload: "" })).toEqual({});
  });

  it("should set the new canvas mappings to the state", () => {
    const type = ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE;
    const payload = {
      canvasLevelMap: {
        0: 0,
      },
    };
    const expected = {
      0: 0,
    };

    expect(reducer(undefined, { type, payload })).toEqual(expected);
  });

  it("should augment the further canvas mappings to the state", () => {
    const type = ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE;
    const payload = {
      canvasLevelMap: {
        0: 0,
      },
    };

    const state = reducer(undefined, { type, payload });

    const payload2 = {
      canvasLevelMap: {
        1: 1,
      },
    };
    const expected = {
      0: 0,
      1: 1,
    };

    expect(reducer(state, { type, payload: payload2 })).toEqual(expected);
  });
});
