import React from "react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { lightTheme } from "selectors/themeSelectors";
import store from "store";
import { MainContainerWidthToggles } from "./MainContainerWidthToggles";

async function navigateWithArrowKeys(key: string, noOfPresses: number) {
  for (let i = 0; i < noOfPresses; i++) {
    await userEvent.keyboard(key);
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

  it("Pressing tab should focus on the first component", async () => {
    const { container } = render(getTestComponent());

    await userEvent.tab();

    // Should focus on the first component
    const tab = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    )[0];

    expect(tab).toHaveFocus();
  });

  it("{ArrowRight} should focus the next item", async () => {
    const { container } = render(getTestComponent());
    const tabs = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    );

    await userEvent.tab();

    await navigateWithArrowKeys("{ArrowRight}", 1);
    expect(tabs[1]).toHaveFocus();

    // Focus back on the first element
    await userEvent.keyboard("{ArrowLeft}");

    // Arrow Right after the last item should focus the first item again
    await navigateWithArrowKeys("{ArrowRight}", tabs.length);
    expect(tabs[0]).toHaveFocus();
  });

  it("{ArrowLeft} should focus the next item", async () => {
    const { container } = render(getTestComponent());
    const tabs = container.getElementsByClassName(
      "ads-v2-segmented-control__segments-container",
    );

    await userEvent.tab();

    // Arrow Left on the First item should focus on the last item
    await navigateWithArrowKeys("{ArrowLeft}", 1);
    expect(tabs[tabs.length - 1]).toHaveFocus();

    await navigateWithArrowKeys("{ArrowLeft}", tabs.length - 1);

    expect(tabs[0]).toHaveFocus();
  });
});
