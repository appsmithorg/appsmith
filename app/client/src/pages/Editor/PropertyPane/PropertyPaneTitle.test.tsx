import React from "react";

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { lightTheme } from "selectors/themeSelectors";
import store from "store";
import { ThemeProvider } from "styled-components";

import PropertyPaneTitle from "./PropertyPaneTitle";

describe("<PropertyPaneTitle />", () => {
  it("should focus when f2 is pressed", async () => {
    const getTestComponent = () => (
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <PropertyPaneTitle actions={[]} isPanelTitle title="" widgetId="1" />
        </ThemeProvider>
      </Provider>
    );
    const component = getTestComponent();
    const renderResult = render(component);
    await userEvent.keyboard("{F2}");
    expect(renderResult.container.querySelector("input")).toBeVisible();
  });
});
