import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
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
    // saving flag set so the field can show a loading spinner
    expect(next.isSavingHtmlLang).toBe(true);
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

describe("applicationsReducer isSavingHtmlLang flag", () => {
  const update = (payload: Record<string, unknown>) =>
    reducer(
      { ...initialState, currentApplication: { id: "app1" } },
      { type: ReduxActionTypes.UPDATE_APPLICATION, payload },
    );

  it("is set for an explicit clear (empty string)", () => {
    expect(
      update({ id: "app1", applicationDetail: { htmlLang: "" } })
        .isSavingHtmlLang,
    ).toBe(true);
  });

  it("is not set for a name-only save", () => {
    expect(update({ id: "app1", name: "New name" }).isSavingHtmlLang).toBe(
      false,
    );
  });

  it("is not set when updating a sibling detail field only", () => {
    expect(
      update({
        id: "app1",
        applicationDetail: { navigationSetting: { orientation: "top" } },
      }).isSavingHtmlLang,
    ).toBe(false);
  });

  it("is reset on UPDATE_APPLICATION_SUCCESS and _ERROR", () => {
    const saving = { ...initialState, isSavingHtmlLang: true };

    expect(
      reducer(saving, {
        type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
        payload: {},
      }).isSavingHtmlLang,
    ).toBe(false);
    expect(
      reducer(saving, {
        type: ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR,
        payload: {},
      }).isSavingHtmlLang,
    ).toBe(false);
  });
});
