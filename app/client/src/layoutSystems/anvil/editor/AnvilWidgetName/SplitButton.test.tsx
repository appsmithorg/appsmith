import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { SplitButton } from "./SplitButton";
import userEvent from "@testing-library/user-event";

const handler = {
  log: jest.fn(),
};
const logSpy = jest.spyOn(handler, "log");

const props = {
  text: "widgetName",
  onClick: () => handler.log("Clicked!"),
  bGCSSVar: "--something",
  colorCSSVar: "--something",
  leftToggle: {
    disable: false,
    onClick: () => handler.log("Left Toggle Clicked!"),
    title: "Left Toggle Title",
  },
  rightToggle: {
    disable: false,
    onClick: () => handler.log("Right Toggle Clicked!"),
    title: "Right Toggle Title",
  },
};

describe("SplitButton", () => {
  it("should show SplitButton", async () => {
    render(<SplitButton {...props} />);
    expect(screen.getByText("widgetName")).toBeInTheDocument();
    expect(screen.queryByTestId("t--splitbutton")).toHaveStyle(
      `color: var(--something)`,
    );
  });

  it("should show and call the click event handler on click", async () => {
    render(<SplitButton {...props} />);
    const clickableButton = screen.getByTestId(
      "t--splitbutton-clickable-button",
    );

    expect(clickableButton).toBeInTheDocument();
    await userEvent.click(clickableButton);
    expect(logSpy).toHaveBeenCalledWith("Clicked!");
  });

  it("should show and call the click event handler on click of left toggle", async () => {
    render(<SplitButton {...props} />);
    const clickableButton = screen.getByTestId("t--splitbutton-left-toggle");

    expect(clickableButton).toBeInTheDocument();
    await userEvent.click(clickableButton);
    expect(logSpy).toHaveBeenCalledWith("Left Toggle Clicked!");
  });

  it("should show and call the click event handler on click of right toggle", async () => {
    render(<SplitButton {...props} />);
    const clickableButton = screen.getByTestId("t--splitbutton-right-toggle");

    expect(clickableButton).toBeInTheDocument();
    await userEvent.click(clickableButton);
    expect(logSpy).toHaveBeenCalledWith("Right Toggle Clicked!");
  });

  it("should hide left and right toggle based on props", async () => {
    const _props = {
      ...props,
      leftToggle: { ...props.leftToggle, disable: true },
      rightToggle: { ...props.rightToggle, disable: true },
    };

    render(<SplitButton {..._props} />);
    expect(
      screen.queryByTestId("t--splitbutton-left-toggle"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("t--splitbutton-right-toggle"),
    ).not.toBeInTheDocument();
  });
});
