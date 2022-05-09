import { integrationEditorURL } from "RouteBuilder";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { INTEGRATION_TABS } from "constants/routes";
import React from "react";
import { Provider } from "react-redux";
import { fireEvent, render, screen } from "test/testUtils";
import OnboardingTasks from "./Tasks";
import { getStore, initialState } from "./testUtils";
import * as reactRedux from "react-redux";
import history from "utils/history";

const useDispatchMock = jest.spyOn(reactRedux, "useDispatch");
const dummyDispatch = jest.fn();
useDispatchMock.mockReturnValue(dummyDispatch);

jest.mock("utils/history", () => {
  return {
    push: jest.fn(),
  };
});
let container: any;

function renderComponent(store: any) {
  render(
    <Provider store={store}>
      <OnboardingTasks />
    </Provider>,
    container,
  );
}

describe("Tasks", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("is rendered", async () => {
    renderComponent(getStore(0));
    const wrapper = await screen.findAllByTestId("onboarding-tasks-wrapper");
    expect(wrapper.length).not.toBe(0);
  });

  it("is showing `Add a datasource` task", async () => {
    const store = getStore(0);
    renderComponent(store);
    const text = await screen.findAllByTestId(
      "onboarding-tasks-datasource-text",
    );
    expect(text.length).toBe(1);
    const button = await screen.findAllByTestId(
      "onboarding-tasks-datasource-button",
    );
    expect(button.length).toBe(1);
    fireEvent.click(button[0]);
    expect(history.push).toHaveBeenCalledWith(
      integrationEditorURL({
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
    const alt = await screen.findAllByTestId("onboarding-tasks-datasource-alt");
    expect(alt.length).toBe(1);
    fireEvent.click(alt[0]);
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION,
      payload: true,
    });
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
      payload: true,
    });
  });

  it("is showing `Add a Query` task", async () => {
    const store = getStore(1);
    renderComponent(store);
    const text = await screen.findAllByTestId("onboarding-tasks-action-text");
    expect(text.length).toBe(1);
    const button = await screen.findAllByTestId(
      "onboarding-tasks-action-button",
    );
    expect(button.length).toBe(1);
    fireEvent.click(button[0]);
    expect(history.push).toHaveBeenCalledWith(
      integrationEditorURL({
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
    const alt = await screen.findAllByTestId("onboarding-tasks-action-alt");
    expect(alt.length).toBe(1);
    fireEvent.click(alt[0]);
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION,
      payload: true,
    });
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
      payload: true,
    });
  });

  it("is showing `Add a widget` task", async () => {
    const store = getStore(2);
    renderComponent(store);
    const text = await screen.findAllByTestId("onboarding-tasks-widget-text");
    expect(text.length).toBe(1);
    const button = await screen.findAllByTestId(
      "onboarding-tasks-widget-button",
    );
    expect(button.length).toBe(1);
    fireEvent.click(button[0]);
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION,
      payload: true,
    });
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
      payload: true,
    });
    const alt = await screen.findAllByTestId("onboarding-tasks-widget-alt");
    expect(alt.length).toBe(1);
    fireEvent.click(alt[0]);
    expect(dummyDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      payload: {
        applicationId: initialState.entities.pageList.applicationId,
      },
    });
  });
});
