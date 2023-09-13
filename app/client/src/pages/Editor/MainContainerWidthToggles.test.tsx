import React from "react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { lightTheme } from "selectors/themeSelectors";
import store from "store";
import { MainContainerWidthToggles } from "./MainContainerWidthToggles";

function navigateWithArrowKeys(key: string, noOfPresses: number) {
  for (let i = 0; i < noOfPresses; i++) {
    userEvent.keyboard(key);
  }
}

describe("<MainContainerWidthToggles />", () => {
  const getTestComponent = () => (
    <ThemeProvider theme={lightTheme}>
      <Provider store={store}>
        <MainContainerWidthToggles />
      </Provider>
    </ThemeProvider>
  );

  it("Pressing tab should focus on the first component", () => {
    const { container } = render(getTestComponent());
    userEvent.tab();

    // Should focus on the first component
    const tab = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    )[0];
    expect(tab).toHaveFocus();
  });

  it("{ArrowRight} should focus the next item", () => {
    const { container } = render(getTestComponent());
    const tabs = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    );
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
    const { container } = render(getTestComponent());
    const tabs = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    );

    userEvent.tab();

    // Arrow Left on the First item should focus on the last item
    navigateWithArrowKeys("{ArrowLeft}", 1);
    expect(tabs[tabs.length - 1]).toHaveFocus();

    navigateWithArrowKeys("{ArrowLeft}", tabs.length - 1);

    expect(tabs[0]).toHaveFocus();
  });
});
