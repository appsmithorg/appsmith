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
    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <Router>
            <PackageMainContainer />
          </Router>
        </Provider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("sidebar-active")).toBeInTheDocument();
  });
});
