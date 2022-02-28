import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import PropertyPaneTitle from "./PropertyPaneTitle";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";
import { Provider } from "react-redux";
import store from "../../store";

describe("<PropertyPaneTitle />", () => {
  const getTestComponent = () => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <PropertyPaneTitle
          actions={[]}
          isPanelTitle
          title="test"
          widgetId="1"
        />
      </ThemeProvider>
    </Provider>
  );

  it("should focus on the component mount", () => {
    const component = getTestComponent();
    const renderResult = render(component);
    expect(renderResult.container.querySelector("input")).toHaveFocus();
  });

  it("should focus when f2 is pressed", async () => {
    const component = getTestComponent();
    const renderResult = render(component);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{F2}");
    expect(renderResult.container.querySelector("input")).toBeVisible();
  });
});
