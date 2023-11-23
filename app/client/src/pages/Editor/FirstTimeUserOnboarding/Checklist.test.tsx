const history = jest.fn();
const dispatch = jest.fn();

import { bindDataOnCanvas } from "actions/pluginActionActions";
import { builderURL, integrationEditorURL } from "@appsmith/RouteBuilder";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { INTEGRATION_TABS } from "constants/routes";
import React from "react";
import { Provider } from "react-redux";
import { fireEvent, render, screen } from "test/testUtils";
import OnboardingChecklist from "./Checklist";
import { getStore, initialState } from "./testUtils";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import "@testing-library/jest-dom";
import * as onboardingSelectors from "selectors/onboardingSelectors";

let container: any = null;

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => dispatch,
  };
});

jest.mock("utils/history", () => ({
  push: history,
  listen: jest.fn(),
}));

jest.mock("utils/lazyLottie", () => ({
  loadAnimation: () => {
    return {
      play: jest.fn(),
      destroy: jest.fn(),
      goToAndStop: jest.fn(),
    };
  },
}));

function renderComponent(store: any) {
  render(
    <Provider store={store}>
      <OnboardingChecklist />
    </Provider>,
    container,
  );
}

describe("Checklist", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    urlBuilder.updateURLParams(
      {
        applicationSlug: initialState.ui.applications.currentApplication.slug,
        applicationId: initialState.entities.pageList.applicationId,
        applicationVersion: 2,
      },
      [
        {
          pageSlug: initialState.entities.pageList.pages[0].slug,
          pageId: initialState.entities.pageList.currentPageId,
        },
      ],
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("is rendered", () => {
    renderComponent(getStore(0));
    const wrapper = screen.getAllByTestId("checklist-wrapper");
    expect(wrapper.length).toBe(1);
    const completionInfo = screen.getAllByTestId("checklist-completion-info");
    expect(completionInfo[0].innerHTML).toBe("0 of 5 ");
    const datasourceButton = screen.getAllByTestId("checklist-datasource");
    expect(datasourceButton.length).toBe(1);
    const actionButton = screen.getAllByTestId("checklist-action");
    expect(actionButton.length).toBe(1);
    const widgetButton = screen.getAllByTestId("checklist-widget");
    expect(widgetButton.length).toBe(1);
    const connectionButton = screen.getAllByTestId("checklist-connection");
    expect(connectionButton.length).toBe(1);
    const deployButton = screen.getAllByTestId("checklist-deploy");
    expect(deployButton.length).toBe(1);
    const banner = screen.queryAllByTestId("checklist-completion-banner");
    expect(banner.length).toBe(0);
    fireEvent.click(datasourceButton[0]);
    expect(history).toHaveBeenCalledWith(
      integrationEditorURL({
        pageId: initialState.entities.pageList.currentPageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  });

  it("disabled items should not be clickable", () => {
    renderComponent(getStore(0));
    const wrapper = screen.getAllByTestId("checklist-wrapper");
    expect(wrapper.length).toBe(1);

    const actionButton = screen.queryAllByTestId("checklist-action");
    dispatch.mockClear();
    fireEvent.click(actionButton[0]);
    expect(dispatch).toHaveBeenCalledTimes(0);

    const connectionButton = screen.queryAllByTestId("checklist-connection");
    dispatch.mockClear();
    fireEvent.click(connectionButton[0]);
    expect(dispatch).toHaveBeenCalledTimes(0);
  });

  it("with `add a datasource` task checked off", () => {
    renderComponent(getStore(1));
    const datasourceButton = screen.queryAllByTestId("checklist-datasource");
    expect(datasourceButton[0]).toHaveStyle("cursor: auto");
    const actionButton = screen.queryAllByTestId("checklist-action");
    fireEvent.click(actionButton[0]);
    expect(history).toHaveBeenCalledWith(
      integrationEditorURL({
        pageId: initialState.entities.pageList.currentPageId,
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
  });

  it("with `add a query` task checked off", () => {
    renderComponent(getStore(2));
    const actionButton = screen.queryAllByTestId("checklist-action");
    expect(actionButton[0]).toHaveStyle("cursor: auto");
    const widgetButton = screen.queryAllByTestId("checklist-widget");
    fireEvent.click(widgetButton[0]);
    expect(history).toHaveBeenCalledWith(
      builderURL({ pageId: initialState.entities.pageList.currentPageId }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.TOGGLE_ONBOARDING_WIDGET_SELECTION,
      payload: true,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
      payload: true,
    });
  });

  it("with `add a widget` task checked off", () => {
    const store: any = getStore(3);
    renderComponent(store);
    const widgetButton = screen.queryAllByTestId("checklist-widget");
    expect(widgetButton[0]).toHaveStyle("cursor: auto");
    const connectionButton = screen.queryAllByTestId("checklist-connection");
    fireEvent.click(connectionButton[0]);
    expect(dispatch).toHaveBeenCalledWith(
      bindDataOnCanvas({
        queryId: store.getState().entities.actions[0].config.id,
        applicationId: store.getState().entities.pageList.applicationId,
        pageId: store.getState().entities.pageList.currentPageId,
      }),
    );
  });

  it("with `connect your data` task checked off", () => {
    const isWidgetActionConnectionPresentSelector = jest.spyOn(
      onboardingSelectors,
      "isWidgetActionConnectionPresent",
    );
    isWidgetActionConnectionPresentSelector.mockImplementation(() => {
      return true;
    });

    renderComponent(getStore(4));
    const connectionButton = screen.queryAllByTestId("checklist-connection");
    expect(connectionButton[0]).toHaveStyle("cursor: auto");
    const deployButton = screen.queryAllByTestId("checklist-deploy");
    fireEvent.click(deployButton[0]);
    expect(dispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      payload: {
        applicationId: initialState.entities.pageList.applicationId,
      },
    });
  });

  it("with `Deploy your application` task checked off", () => {
    renderComponent(getStore(5));
    const deployButton = screen.queryAllByTestId("checklist-deploy-button");
    expect(deployButton.length).toBe(0);
    const banner = screen.queryAllByTestId("checklist-completion-banner");
    expect(banner.length).toBe(1);
  });
});
