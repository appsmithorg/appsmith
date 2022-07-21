import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "constants/DefaultTheme";
import store from "store";
import { MainContainerLayoutControl } from "./MainContainerLayoutControl";

function navigateWithArrowKeys(key: string, noOfPresses: number) {
  for (let i = 0; i < noOfPresses; i++) {
    userEvent.keyboard(key);
  }
}

describe("<MainContainerLayoutControl />", () => {
  const getTestComponent = () => (
    <ThemeProvider theme={lightTheme}>
      <Provider store={store}>
        <MainContainerLayoutControl />
      </Provider>
    </ThemeProvider>
  );

  it("Pressing tab should focus on the first component", () => {
    render(getTestComponent());
    userEvent.tab();

    // Should focus on the first component
    const tab = screen.getAllByRole("button")[0];
    expect(tab).toHaveFocus();
  });

  it("{ArrowRight} should focus the next item", () => {
    render(getTestComponent());
    const tabs = screen.getAllByRole("button");
    userEvent.tab();

    navigateWithArrowKeys("{ArrowRight}", 1);
    expect(tabs[1]).toHaveFocus();

    // Focus back on the first element
    userEvent.keyboard("{ArrowLeft}");

    // Arrow Right after the last item should focus the first item again
    navigateWithArrowKeys("{ArrowRight}", tabs.length);
    expect(tabs[0]).toHaveFocus();
  });

  it("{ArrowLeft} should focus the next item", async () => {
    render(getTestComponent());
    const tabs = screen.getAllByRole("button");
    userEvent.tab();

    // Arrow Left on the First item should focus on the last item
    navigateWithArrowKeys("{ArrowLeft}", 1);
    expect(tabs[tabs.length - 1]).toHaveFocus();

    navigateWithArrowKeys("{ArrowLeft}", tabs.length - 1);

    expect(tabs[0]).toHaveFocus();
  });
});
