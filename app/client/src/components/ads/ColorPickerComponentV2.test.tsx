import React from "react";
import store from "store";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { ThemeProvider } from "constants/DefaultTheme";
import ColorPickerComponent from "./ColorPickerComponentV2";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";

const getTestComponent = (handleOnChange: any = undefined) => (
  <Provider store={store}>
    <ThemeProvider theme={lightTheme}>
      <ColorPickerComponent
        changeColor={handleOnChange}
        color="#ffffff"
        showApplicationColors
        showThemeColors
      />
    </ThemeProvider>
  </Provider>
);

describe("<ColorPicker />", () => {
  it("Clicking the input should open the colorpicker", () => {
    render(getTestComponent());
    expect(screen.queryByTestId("color-picker")).not.toBeInTheDocument();
    screen.getByRole("textbox").click();
    expect(screen.getByTestId("color-picker")).toBeInTheDocument();
  });

  it("Clicking the color inside input should open the colorpicker", () => {
    render(getTestComponent());
    expect(screen.queryByTestId("color-picker")).not.toBeInTheDocument();
    (screen.getByRole("textbox")?.previousSibling as HTMLElement)?.click();
    expect(screen.getByTestId("color-picker")).toBeInTheDocument();
  });

  it("Focusing the input using mouse should open the colorpicker and keep the focus on the input", () => {
    render(getTestComponent());
    expect(screen.queryByTestId("color-picker")).not.toBeInTheDocument();

    // Simulating clicking and focus
    screen.getByRole("textbox").focus();
    screen.getByRole("textbox").click();

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByTestId("color-picker")).toBeInTheDocument();
  });
});

describe("<ColorPicker /> - Keyboard Navigation", () => {
  it("Pressing tab should focus the component", () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("Pressing {Enter} should open the colorpicker", async () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.queryByTestId("color-picker")).toBeNull();
    userEvent.keyboard("{Enter}");
    expect(screen.queryByTestId("color-picker")).toBeInTheDocument();
  });

  it("Pressing {Escape} should close the colorpicker", async () => {
    render(getTestComponent());
    userEvent.tab();
    expect(screen.queryByTestId("color-picker")).toBeNull();
    userEvent.keyboard("{Enter}");
    expect(screen.queryByTestId("color-picker")).toBeInTheDocument();
    userEvent.keyboard("{Escape}");
    await waitForElementToBeRemoved(screen.queryByTestId("color-picker"));
  });

  it("Pressing {Tab} should shift sections in the colorpicker", async () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[0],
    ).toHaveFocus();

    userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    // Back to first color
    userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[0],
    ).toHaveFocus();
  });

  it("Pressing {ArrowRight} should shift focus to color to the right", () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    userEvent.tab();
    userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowRight}");

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[1],
    ).toHaveFocus();
  });

  it("Pressing {ArrowLeft} should shift focus to color to the left", () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    userEvent.tab();
    userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowRight}");

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[2],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowLeft}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[1],
    ).toHaveFocus();
  });

  it("Pressing {ArrowDown} should shift focus to color to the bottom", () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    userEvent.tab();
    userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[10],
    ).toHaveFocus();
  });

  it("Pressing {ArrowUp} should shift focus to color to the top", () => {
    render(getTestComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");

    userEvent.tab();
    userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[21],
    ).toHaveFocus();

    userEvent.keyboard("{ArrowUp}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[11],
    ).toHaveFocus();
  });

  it("Pressing {Enter} should select the color in focus", async () => {
    const onColorChange = jest.fn();
    render(getTestComponent(onColorChange));
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    userEvent.tab();
    userEvent.tab();
    userEvent.keyboard("{ArrowRight}");
    userEvent.keyboard("{Enter}");
    expect(onColorChange).toBeCalled();
    await waitForElementToBeRemoved(screen.queryByTestId("color-picker"));
  }, 10000);
});
