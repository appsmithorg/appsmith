import store from "store";
import React from "react";
import { ThemeProvider, theme } from "constants/DefaultTheme";
import InputComponent from "components/designSystems/blueprint/InputComponent";
import { Provider } from "react-redux";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

describe("<InputComponent />", () => {
  it("contains textarea with resize disabled", () => {
    act(() => {
      ReactDOM.render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <InputComponent
              inputType="TEXT"
              isInvalid={false}
              isLoading={false}
              label="label"
              multiline
              onCurrencyTypeChange={(code?: string) => {
                console.log(code);
              }}
              onFocusChange={(state: boolean) => {
                console.log(state);
              }}
              onValueChange={(valueAsString: string) => {
                console.log(valueAsString);
              }}
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
