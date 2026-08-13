import store from "store";
import React from "react";
import { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import { fireEvent, render, screen } from "@testing-library/react";

import EvaluatedValuePopup, {
  getEvaluatedPopupPlacement,
} from "./EvaluatedValuePopup";
import { theme } from "constants/DefaultTheme";
import { EditorTheme } from "./EditorConfig";
import { LOCAL_STORAGE_KEYS } from "utils/localStorage";

function renderPopup(props?: {
  hasError?: boolean;
  hideEvaluatedValue?: boolean;
}) {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <EvaluatedValuePopup
          errors={[]}
          hasError={props?.hasError || false}
          hideEvaluatedValue={props?.hideEvaluatedValue || false}
          isOpen
          theme={EditorTheme.LIGHT}
        >
          <div>children</div>
        </EvaluatedValuePopup>
      </ThemeProvider>
    </Provider>,
  );
}

describe("EvaluatedValuePopup", () => {
  beforeEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED);
  });

  it("should render evaluated popup when hideEvaluatedValue is false", () => {
    renderPopup();
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeTruthy();
  });

  it("should not render evaluated popup when hideEvaluatedValue is true", () => {
    renderPopup({ hideEvaluatedValue: true });
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeNull();
  });

  it("should collapse the popup and persist the preference when the toggle is clicked", () => {
    renderPopup();

    fireEvent.click(screen.getByTestId("t--evaluated-popup-collapse-toggle"));

    expect(screen.queryByTestId("evaluated-value-popup-title")).toBeNull();
    expect(
      localStorage.getItem(LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED),
    ).toBe("true");
  });

  it("should render collapsed when the persisted preference is set", () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED,
      "true",
    );

    renderPopup();

    expect(screen.queryByTestId("evaluated-value-popup-title")).toBeNull();

    fireEvent.click(screen.getByTestId("t--evaluated-popup-collapse-toggle"));

    expect(screen.getByTestId("evaluated-value-popup-title")).toBeTruthy();
    expect(
      localStorage.getItem(LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED),
    ).toBe("false");
  });

  it("should place the popup left of fields on the right half of the viewport (property pane)", () => {
    expect(getEvaluatedPopupPlacement(900, 1440, 36)).toEqual([
      "left-start",
      "0, 15",
    ]);
    expect(getEvaluatedPopupPlacement(720, 1440, 300)).toEqual([
      "left-start",
      "0, 15",
    ]);
  });

  it("should place the popup below short wide-form fields on the left half of the viewport", () => {
    expect(getEvaluatedPopupPlacement(100, 1440, 36)).toEqual([
      "bottom-start",
      "0, 8",
    ]);
    expect(getEvaluatedPopupPlacement(719, 1440, 60)).toEqual([
      "bottom-start",
      "0, 8",
    ]);
  });

  it("should keep the popup on the left for tall multiline editors on the left half", () => {
    expect(getEvaluatedPopupPlacement(300, 1440, 61)).toEqual([
      "left-start",
      "0, 5",
    ]);
    expect(getEvaluatedPopupPlacement(100, 1440, 500)).toEqual([
      "left-start",
      "0, 5",
    ]);
  });

  it("should show an error indicator on the collapsed pill when there is an error", () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED,
      "true",
    );

    renderPopup({ hasError: true });

    expect(
      screen.getByTestId("t--evaluated-popup-error-indicator"),
    ).toBeTruthy();
  });
});
