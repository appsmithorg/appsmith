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

function popupJsx(props?: {
  hasError?: boolean;
  hideEvaluatedValue?: boolean;
  isOpen?: boolean;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <EvaluatedValuePopup
          errors={[]}
          hasError={props?.hasError || false}
          hideEvaluatedValue={props?.hideEvaluatedValue || false}
          isOpen={props?.isOpen ?? true}
          theme={EditorTheme.LIGHT}
        >
          <div>children</div>
        </EvaluatedValuePopup>
      </ThemeProvider>
    </Provider>
  );
}

function renderPopup(props?: {
  hasError?: boolean;
  hideEvaluatedValue?: boolean;
  isOpen?: boolean;
}) {
  return render(popupJsx(props));
}

// Drags the popup by its handle so its internal dragged-position state is
// set, exactly as a user drag would. jsdom elements measure 0x0, and a
// zero-size popup is treated as closed on mouseup, so give the popper
// element a real box first.
function dragPopupTo(clientX: number, clientY: number) {
  const popperElement = document.querySelector(".t--CodeEditor-evaluatedValue")
    ?.parentElement as HTMLElement;

  popperElement.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      width: 300,
      height: 118,
      right: 400,
      bottom: 218,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect;

  const handle = document.querySelector(
    "[id$='-popper-draghandler']",
  ) as HTMLElement;

  fireEvent.mouseDown(handle, { clientX: 10, clientY: 10 });
  fireEvent.mouseMove(document, { clientX, clientY });
  fireEvent.mouseUp(document, { clientX, clientY });

  return popperElement;
}

describe("EvaluatedValuePopup", () => {
  beforeEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EVALUATED_VALUE_POPUP_COLLAPSED);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it("should keep the dragged position across a window-level blur (minimize / app switch)", () => {
    jest.spyOn(document, "hasFocus").mockReturnValue(false);

    const { rerender } = renderPopup();

    // the anchor ref is null on the very first render; a second render lets
    // the popper attach and create its drag handle
    rerender(popupJsx({ isOpen: true }));
    dragPopupTo(60, 60);

    // window loses focus -> editor blurs -> popup closes
    rerender(popupJsx({ isOpen: false }));
    // window restored, editor refocuses -> popup reopens
    rerender(popupJsx({ isOpen: true }));

    const popperElement = document.querySelector(
      ".t--CodeEditor-evaluatedValue",
    )?.parentElement as HTMLElement;

    expect(popperElement.style.top).toBe("100px");
    expect(popperElement.style.left).toBe("100px");
  });

  it("should re-anchor after an in-app blur discards the dragged position", () => {
    jest.spyOn(document, "hasFocus").mockReturnValue(true);

    const { rerender } = renderPopup();

    rerender(popupJsx({ isOpen: true }));
    dragPopupTo(60, 60);

    // the user moves on inside the app: close and reopen
    rerender(popupJsx({ isOpen: false }));
    rerender(popupJsx({ isOpen: true }));

    const popperElement = document.querySelector(
      ".t--CodeEditor-evaluatedValue",
    )?.parentElement as HTMLElement;

    expect(popperElement.style.top).not.toBe("100px");
    expect(popperElement.style.left).not.toBe("100px");
  });
});
