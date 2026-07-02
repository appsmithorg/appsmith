import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import applicationsReducer, { initialState } from "./applicationsReducer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = applicationsReducer as any;

describe("applicationsReducer UPDATE_APPLICATION", () => {
  it("merges applicationDetail into currentApplication, preserving siblings", () => {
    const state = {
      ...initialState,
      currentApplication: {
        id: "app1",
        applicationDetail: {
          navigationSetting: { orientation: "top" },
          htmlLang: "en",
        },
      },
    };

    const next = reducer(state, {
      type: ReduxActionTypes.UPDATE_APPLICATION,
      payload: { id: "app1", applicationDetail: { htmlLang: "de" } },
    });

    expect(next.currentApplication.applicationDetail.htmlLang).toBe("de");
    // sibling untouched
    expect(next.currentApplication.applicationDetail.navigationSetting).toEqual(
      {
        orientation: "top",
      },
    );
  });

  it("is a no-op on currentApplication when none is loaded", () => {
    const state = {
      ...initialState,
      currentApplication: null,
    };

    const next = reducer(state, {
      type: ReduxActionTypes.UPDATE_APPLICATION,
      payload: { id: "app1", applicationDetail: { htmlLang: "de" } },
    });

    expect(next.currentApplication).toBeNull();
  });
});
