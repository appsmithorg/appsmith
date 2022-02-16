import React from "react";
import "@testing-library/jest-dom";
import { render, waitFor, screen } from "test/testUtils";
import ColorPickerComponent from "./ColorPickerComponentV2";
import userEvent from "@testing-library/user-event";

// let container: any;
describe("Unit tests for ColorPicker v2", () => {
  /**
   * Test cases:
   * 1. Does component render?
   * 2. Check if
   *      - color palletes exists
   *      - Check if pre-selected color exists
   *      - Check if color rings exists
   *      - Check if changeColor handler is called
   */
  it("Does component render?", () => {
    const mockFn = jest.fn();

    render(
      <ColorPickerComponent
        changeColor={mockFn}
        color="red"
        showApplicationColors
        showThemeColors
      />,
    );

    waitFor(() => {
      expect(document.querySelector("div")).toHaveAttribute(
        "class",
        "popover-target-colorpicker t--colorpicker-v2-popover",
      );
    });
  });

  it("Check if pre-selected color exists", () => {
    const mockFn = jest.fn();
    render(
      <ColorPickerComponent
        changeColor={mockFn}
        color="red"
        showApplicationColors
        showThemeColors
      />,
    );

    waitFor(() => {
      expect(
        screen.getByPlaceholderText("enter color name or hex"),
      ).toHaveValue("red");
    });
  });

  it("Check if color rings exists", () => {
    const mockFn = jest.fn();
    render(
      <ColorPickerComponent
        changeColor={mockFn}
        color="red"
        showApplicationColors
        showThemeColors
      />,
    );

    userEvent.click(screen.getByPlaceholderText("enter color name or hex"));
    const themeColors = screen.getByText("Theme Colors");
    waitFor(() => {
      expect(themeColors.querySelector("div div")).toHaveClass(
        "t--colorpicker-v2-color",
      );
    });
  });

  it("Check if changeColor handler is called", () => {
    const mockFn = jest.fn((color: string) => console.log(color));
    render(
      <ColorPickerComponent
        changeColor={mockFn}
        color="red"
        showApplicationColors
        showThemeColors
      />,
    );

    userEvent.click(screen.getByPlaceholderText("enter color name or hex"));
    const singleThemeColor = screen
      .getByText("Theme Colors")
      .querySelector(".t--colorpicker-v2-color") as HTMLElement;
    waitFor(() => {
      userEvent.click(singleThemeColor);
      expect(mockFn.mock.calls.length).toEqual(1);
    });

    userEvent.click(screen.getByPlaceholderText("enter color name or hex"));
    const singleAllColor = screen
      .getByText("All Colors")
      .querySelector(".t--colorpicker-v2-color") as HTMLElement;
    waitFor(() => {
      userEvent.click(singleAllColor);
      expect(mockFn.mock.calls.length).toEqual(1);
    });
  });
});
