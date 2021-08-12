import React from "react";
import { Provider } from "react-redux";
import { render, screen } from "test/testUtils";
import OnboardingStatusbar from "./Statusbar";
import { getStore } from "./testUtils";
import {
  ONBOARDING_STEPS_FIRST,
  ONBOARDING_STEPS_SECOND,
  ONBOARDING_STEPS_THIRD,
  ONBOARDING_STEPS_FOURTH,
  ONBOARDING_STEPS_FIVETH,
  ONBOARDING_STEPS_SIXTH,
} from "./constants";

let useIsWidgetActionConnectionPresent = false;
jest.mock("pages/Editor/utils", () => ({
  useIsWidgetActionConnectionPresent: () => useIsWidgetActionConnectionPresent,
}));

let container: any = null;

function renderComponent(store: any) {
  render(
    <Provider store={store}>
      <OnboardingStatusbar />
    </Provider>,
    container,
  );
}

describe("Statusbar", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", async (done) => {
    renderComponent(getStore(0));
    const statusbar = screen.queryAllByTestId("statusbar-container");
    expect(statusbar).toHaveLength(1);
    done();
  });

  it("is pro", async (done) => {
    renderComponent(getStore(0));
    const statusbar = screen.queryAllByTestId("statusbar-container");
    expect(statusbar).not.toBeNull();
    done();
  });

  it("is showing first step", async () => {
    renderComponent(getStore(0));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_FIRST);
  });

  it("is showing second step", async () => {
    renderComponent(getStore(1));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_SECOND);
  });

  it("is showing third step", async () => {
    renderComponent(getStore(2));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_THIRD);
  });

  it("is showing fourth step", async () => {
    renderComponent(getStore(3));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_FOURTH);
  });

  it("is showing fifth step", async () => {
    useIsWidgetActionConnectionPresent = true;
    renderComponent(getStore(4));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_FIVETH);
  });

  it("is showing fifth step", async () => {
    renderComponent(getStore(5));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STEPS_SIXTH);
  });
});
