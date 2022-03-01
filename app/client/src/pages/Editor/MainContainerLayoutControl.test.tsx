import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";

import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "constants/DefaultTheme";
import store from "../../store";
import { MainContainerLayoutControl } from "./MainContainerLayoutControl";

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
    const tab = screen.getAllByRole("tab")[0];
    expect(tab).toHaveFocus();
  });

  it("{ArrowRight} should focus the next item", () => {
    render(getTestComponent());
    userEvent.tab();
    let tab;

    userEvent.keyboard("{ArrowRight}");
    tab = screen.getAllByRole("tab")[1];
    expect(tab).toHaveFocus();

    // Arrow Right after the last item should focus the first item again
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");
    tab = screen.getAllByRole("tab")[0];
    expect(tab).toHaveFocus();
  });

  it("{ArrowLeft} should focus the next item", async () => {
    render(getTestComponent());
    userEvent.tab();
    let tab;

    userEvent.keyboard("{ArrowLeft}");
    tab = screen.getAllByRole("tab")[4];
    expect(tab).toHaveFocus();

    // Arrow Right after the last item should focus the first item again
    userEvent.keyboard("{ArrowLeft}");
    userEvent.keyboard("{ArrowLeft}");
    userEvent.keyboard("{ArrowLeft}");
    userEvent.keyboard("{ArrowLeft}");
    tab = screen.getAllByRole("tab")[0];
    expect(tab).toHaveFocus();
  });
});
