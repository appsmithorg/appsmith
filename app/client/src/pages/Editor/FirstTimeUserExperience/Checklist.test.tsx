import React from "react";
import { Provider } from "react-redux";
import { render, screen } from "test/testUtils";
import OnboardingChecklist from "./Checklist";
import { getStore } from "./testUtils";

let container: any = null;

let useIsWidgetActionConnectionPresent = false;
jest.mock("pages/Editor/utils", () => ({
  useIsWidgetActionConnectionPresent: () => useIsWidgetActionConnectionPresent,
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
  });

  it("is rendered", () => {
    renderComponent(getStore(0));
    const wrapper = screen.getAllByTestId("checklist-wrapper");
    expect(wrapper.length).toBe(1);
    const completionInfo = screen.getAllByTestId("checklist-completion-info");
    expect(completionInfo[0].innerHTML).toBe("0 of 5");
    const datasourceButton = screen.getAllByTestId(
      "checklist-datasource-button",
    );
    expect(datasourceButton.length).toBe(1);
    const actionButton = screen.getAllByTestId("checklist-action-button");
    expect(actionButton.length).toBe(1);
    const widgetButton = screen.getAllByTestId("checklist-widget-button");
    expect(widgetButton.length).toBe(1);
    const connectionButton = screen.getAllByTestId(
      "checklist-connection-button",
    );
    expect(connectionButton.length).toBe(1);
    const deployButton = screen.getAllByTestId("checklist-deploy-button");
    expect(deployButton.length).toBe(1);
    const banner = screen.queryAllByTestId("checklist-completion-banner");
    expect(banner.length).toBe(0);
  });

  it("with `add a datasource` task checked off", () => {
    renderComponent(getStore(1));
    const datasourceButton = screen.queryAllByTestId(
      "checklist-datasource-button",
    );
    expect(datasourceButton.length).toBe(0);
  });

  it("with `add a query` task checked off", () => {
    renderComponent(getStore(2));
    const actionButton = screen.queryAllByTestId("checklist-action-button");
    expect(actionButton.length).toBe(0);
  });

  it("with `add a widget` task checked off", () => {
    renderComponent(getStore(3));
    const widgetButton = screen.queryAllByTestId("checklist-widget-button");
    expect(widgetButton.length).toBe(0);
  });

  it("with `connect your data` task checked off", () => {
    useIsWidgetActionConnectionPresent = true;
    renderComponent(getStore(4));
    const connectionButton = screen.queryAllByTestId(
      "checklist-connection-button",
    );
    expect(connectionButton.length).toBe(0);
  });

  it("with `Deploy your application` task checked off", () => {
    renderComponent(getStore(5));
    const deployButton = screen.queryAllByTestId("checklist-connection-button");
    expect(deployButton.length).toBe(0);
    const banner = screen.queryAllByTestId("checklist-completion-banner");
    expect(banner.length).toBe(1);
  });
});
