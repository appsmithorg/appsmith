import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Button, { Size } from "./Button";
import { create } from "react-test-renderer";
import { lightTheme } from "../../selectors/themeSelectors";
import { ThemeProvider } from "constants/DefaultTheme";

describe("<Button /> component - render", () => {
  it("renders the button component with text passed as input", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <Button size={Size.medium} tag="button" text="Run" />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Run");
  });
});

describe("<Button /> component - loading behaviour", () => {
  it("calls the onclick handler when not in loading state", () => {
    const fn = jest.fn();
    const tree = create(
      <ThemeProvider theme={lightTheme}>
        <Button
          isLoading={false}
          onClick={fn}
          size={Size.medium}
          tag="button"
          text="Run"
        />
      </ThemeProvider>,
    );
    const button = tree.root.findByType("button");
    button.props.onClick();
    expect(fn.mock.calls.length).toBe(1);
  });

  it("does not call the onclick handler when in loading state", () => {
    const fn = jest.fn();
    const tree = create(
      <ThemeProvider theme={lightTheme}>
        <Button
          isLoading
          onClick={fn}
          size={Size.medium}
          tag="button"
          text="Run"
        />
      </ThemeProvider>,
    );
    const button = tree.root.findByType("button");
    button.props.onClick();
    expect(fn.mock.calls.length).toBe(0);
  });
});
