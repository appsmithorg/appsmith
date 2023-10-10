import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";

import store from "store";
import PackageMainContainer from "./PackageMainContainer";
import { lightTheme } from "selectors/themeSelectors";

describe("PackageMainContainer", () => {
  it("renders sidebar and app body", () => {
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <Router>
            <PackageMainContainer />
          </Router>
        </Provider>
      </ThemeProvider>,
    );

    const body = container.querySelector("#app-body");

    expect(body).not.toBeNull();
    expect(screen.getByTestId("sidebar-active")).toBeInTheDocument();
  });
});
