import React from "react";

import { render, screen } from "@testing-library/react";
import { theme } from "constants/DefaultTheme";
import { Provider } from "react-redux";
import store from "store";
import { ThemeProvider } from "styled-components";

import { EditorTheme } from "./EditorConfig";
import EvaluatedValuePopup from "./EvaluatedValuePopup";

describe("EvaluatedValuePopup", () => {
  it("should render evaluated popup when hideEvaluatedValue is false", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <EvaluatedValuePopup
            errors={[]}
            hasError={false}
            hideEvaluatedValue={false}
            isOpen
            theme={EditorTheme.LIGHT}
          >
            <div>children</div>
          </EvaluatedValuePopup>
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeTruthy();
  });

  it("should not render evaluated popup when hideEvaluatedValue is true", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <EvaluatedValuePopup
            errors={[]}
            hasError={false}
            hideEvaluatedValue
            isOpen
            theme={EditorTheme.LIGHT}
          >
            <div>children</div>
          </EvaluatedValuePopup>
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeNull();
  });
});
