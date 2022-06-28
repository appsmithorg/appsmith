import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import StepComponent from "./StepComponent";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

describe("<StepComponent /> - Keyboard navigation", () => {
  const getTestComponent = (handleOnChange: any = noop) => (
    <ThemeProvider theme={lightTheme}>
      <StepComponent
        displayFormat={(value: number): string => {
          return `${value}%`;
        }}
        max={100}
        min={0}
        onChange={handleOnChange}
        steps={5}
        value={50}
      />
    </ThemeProvider>
  );

  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByTestId("step-wrapper")).toHaveFocus();
    expect(screen.getByTestId("step-wrapper")).toHaveTextContent("50%");
  });

  it.each(["{ArrowUp}", "{ArrowRight}"])(
    "Pressing %s should increase the value",
    (k) => {
      const fn = jest.fn();
      render(getTestComponent(fn));
      userEvent.tab();
      userEvent.keyboard(k);
      expect(fn).toBeCalledWith(55, true);
    },
  );

  it.each(["{ArrowDown}", "{ArrowLeft}"])(
    "Pressing %s should increase the value",
    (k) => {
      const fn = jest.fn();
      render(getTestComponent(fn));
      userEvent.tab();
      userEvent.keyboard(k);
      expect(fn).toBeCalledWith(45, true);
    },
  );
});
