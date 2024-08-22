import React from "react";

import ReactDOM from "react-dom";

import { theme } from "constants/DefaultTheme";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import store from "store";
import { ThemeProvider } from "styled-components";
import { noop } from "utils/AppsmithUtils";

import InputComponent from "./";

let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container as Node);
  container = null;
});

describe("<InputComponent />", () => {
  it("contains textarea with resize disabled", () => {
    act(() => {
      ReactDOM.render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            {/* @ts-expect-error: type mismatch */}
            <InputComponent
              inputType="TEXT"
              isInvalid={false}
              isLoading={false}
              label="label"
              multiline
              onCurrencyTypeChange={noop}
              onFocusChange={noop}
              onValueChange={noop}
              showError={false}
              value="something"
              widgetId="24234r35"
            />
          </ThemeProvider>
        </Provider>,
        container,
      );
    });
    const textarea = container?.querySelector("textarea");
    const styles = textarea ? getComputedStyle(textarea) : { resize: "" };
    expect(styles.resize).toEqual("none");
  });
});
