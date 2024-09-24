import React from "react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import ColorPickerComponent from "./ColorPickerComponentV2";
import { lightTheme } from "selectors/themeSelectors";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";

const mockStore = configureStore([]);
const store = mockStore({
  entities: {
    canvasWidgets: {
      0: {},
    },
  },
  ui: {
    appTheming: {
      selectedTheme: {
        properties: {
          colors: {
            primaryColor: "#553DE9",
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
  },
  tenant: {
    userPermissions: [],
    tenantConfiguration: {
      brandColors: {},
    },
    new: false,
  },
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  it("Pressing tab should focus the component", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("Pressing {Enter} should open the colorpicker", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.queryByTestId("color-picker")).toBeNull();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("color-picker")).toBeInTheDocument();
  });

  it("Pressing {Escape} should close the colorpicker", async () => {
    render(getTestComponent());
    await userEvent.tab();
    expect(screen.queryByTestId("color-picker")).toBeNull();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("color-picker")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitForElementToBeRemoved(screen.queryByTestId("color-picker"));
  });

  it("Pressing {Tab} should shift sections in the colorpicker", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.tab();
    await userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[0],
    ).toHaveFocus();

    await userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    // Back to first color
    await userEvent.tab();
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[0],
    ).toHaveFocus();
  });

  it("Pressing {ArrowRight} should shift focus to color to the right", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[1],
    ).toHaveFocus();
  });

  it("Pressing {ArrowLeft} should shift focus to color to the left", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[2],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[1],
    ).toHaveFocus();
  });

  it("Pressing {ArrowDown} should shift focus to color to the bottom", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[10],
    ).toHaveFocus();
  });

  it("Pressing {ArrowUp} should shift focus to color to the top", async () => {
    render(getTestComponent());
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[21],
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowUp}");
    expect(
      document.querySelectorAll("[tabindex='0'].t--colorpicker-v2-color")[1]
        .parentElement?.childNodes[11],
    ).toHaveFocus();
  });

  it("Pressing {Enter} should select the color in focus", async () => {
    const onColorChange = jest.fn();

    render(getTestComponent(onColorChange));
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    expect(onColorChange).toBeCalled();
    await waitForElementToBeRemoved(screen.queryByTestId("color-picker"));
  });
});
