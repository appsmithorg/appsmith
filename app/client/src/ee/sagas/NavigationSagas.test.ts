import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import * as helpers from "@appsmith/pages/Editor/Explorer/helpers";
import { call } from "redux-saga/effects";
import { EE_handleRouteChange } from "./NavigationSagas";
import { clearAllWindowMessageListeners } from "./WindowMessageListener/WindowMessageListenerSagas";
import * as constants from "./NavigationSagas";

const hasNavigatedOutOfPage = jest.spyOn(helpers, "hasNavigatedOutOfPage");
const assertOutOfPageNavigation = (result: boolean, iter: Generator) => {
  if (result) {
    expect(iter.next().value).toEqual(call(clearAllWindowMessageListeners));
    // yield call
    expect(iter.next().done).toBeTruthy();
    expect(hasNavigatedOutOfPage).toReturnWith(true);
  } else {
    expect(iter.next().done).toBeTruthy();
    expect(hasNavigatedOutOfPage).toReturnWith(false);
  }
};

describe("handle EE navigation - hasNavigatedOutOfPage", () => {
  const cloudHostingOrginalValue = constants.cloudHosting;
  beforeAll(() => {
    Object.defineProperty(constants, "cloudHosting", {
      value: false,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    Object.defineProperty(constants, "cloudHosting", {
      value: cloudHostingOrginalValue,
    });
  });
  it("1. on page load", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname:
            "/app/untitled-application-2/page1-634fc30f5f559f5079c6de02/edit",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(false, iter);
  });

  it("2. go to next page", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname:
            "/app/untitled-application-2/page2-90007763dc264920d5e25b59/edit",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(true, iter);
  });

  it("2. go to js object in same page", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname:
            "/app/untitled-application-2/page2-90007763dc264920d5e25b59/edit/jsObjects/635fa6900264ba459f175e0e",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(false, iter);
  });

  it("3. go back to canvas", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname:
            "/app/untitled-application-2/page2-90007763dc264920d5e25b59/edit",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(false, iter);
  });

  it("4. go to next page", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname:
            "/app/untitled-application-2/page3-999999763dc264920d5e25b59/edit",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(true, iter);
  });

  it("4. go to home page", () => {
    const iter = EE_handleRouteChange({
      type: ReduxActionTypes.ROUTE_CHANGED,
      payload: {
        location: {
          pathname: "/applications",
          hash: "",
          search: "",
          state: {},
        },
      },
    });
    assertOutOfPageNavigation(true, iter);
  });
});
