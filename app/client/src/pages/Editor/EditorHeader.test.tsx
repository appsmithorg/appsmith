import React from "react";
import EditorHeader from "./EditorHeader";
import { render, screen } from "test/testUtils";
import type { AppState } from "@appsmith/reducers";

function renderComponent(initialState?: Partial<AppState>) {
  render(<EditorHeader />, {
    initialState,
  });
}

describe("EditorHeader", () => {
  it("Show sidebar nav button by default", () => {
    renderComponent();
    const wrapper = screen.queryAllByTestId("sidebar-nav-button");
    expect(wrapper.length).toBe(1);
  });
  it("sidebar nav button should be hidden when signposting is enabled", () => {
    const initialState: any = {
      entities: {
        pageList: {
          applicationId: "1",
        },
      },
      ui: {
        onBoarding: {
          firstTimeUserOnboardingApplicationIds: ["1"],
        },
      },
    };

    renderComponent(initialState);
    const wrapper = screen.queryAllByTestId("sidebar-nav-button");
    expect(wrapper.length).toBe(0);
  });
});
