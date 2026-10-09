import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import LabelWithTooltip from "./LabelWithTooltip";

const renderLabel = (isRequired?: boolean) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <LabelWithTooltip compact={false} isRequired={isRequired} text="Name" />
    </ThemeProvider>,
  );

describe("LabelWithTooltip required marker", () => {
  it("renders the required marker when isRequired is true", () => {
    renderLabel(true);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("(required)")).toHaveTextContent("*");
  });

  it("does not render the required marker when isRequired is false", () => {
    renderLabel(false);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });

  it("does not render the required marker when isRequired is unset", () => {
    renderLabel();

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
