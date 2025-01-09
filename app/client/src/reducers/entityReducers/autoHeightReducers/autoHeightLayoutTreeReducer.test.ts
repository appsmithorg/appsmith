import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import reducer from "./autoHeightLayoutTreeReducer";
import type { AutoHeightLayoutTreeReduxState } from "./autoHeightLayoutTreeReducer.types";

describe("Canvas Levels Reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "", payload: "" })).toEqual({});
  });

  it("should set the new auto height layout tree", () => {
    const type = ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE;
    const payload = {
      tree: {
        0: {
          aboves: [],
          belows: [],
          topRow: 0,
          bottomRow: 0,
          originalTopRow: 0,
          originalBottomRow: 0,
        },
      },
    };

    const expected = {
      0: {
        aboves: [],
        belows: [],
        topRow: 0,
        bottomRow: 0,
        originalTopRow: 0,
        originalBottomRow: 0,
      },
    };

    expect(reducer(undefined, { type, payload })).toEqual(expected);
  });

  it("should augment the auto height layout tree further in the state", () => {
    const type = ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE;
    const payload = {
      tree: {
        0: {
          aboves: [],
          belows: [],
          topRow: 0,
          bottomRow: 0,
          originalTopRow: 0,
          originalBottomRow: 0,
        },
      },
    };

    const state = reducer(undefined, { type, payload });

    const payload2 = {
      tree: {
        0: {
          aboves: [],
          belows: [1],
          topRow: 0,
          bottomRow: 0,
          originalTopRow: 0,
          originalBottomRow: 0,
        },
        1: {
          aboves: [0],
          belows: [],
          topRow: 10,
          bottomRow: 10,
          originalTopRow: 10,
          originalBottomRow: 10,
        },
      },
    };

    const expected = {
      0: {
        aboves: [],
        belows: [1],
        topRow: 0,
        bottomRow: 0,
        originalTopRow: 0,
        originalBottomRow: 0,
      },
      1: {
        aboves: [0],
        belows: [],
        topRow: 10,
        bottomRow: 10,
        originalTopRow: 10,
        originalBottomRow: 10,
      },
    };

    const state2 = reducer(state, { type, payload: payload2 });

    expect(state2).toEqual(expected);
  });
});
