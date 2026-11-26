import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { Alignment } from "@blueprintjs/core";
import { lightTheme } from "selectors/themeSelectors";
import SwitchGroupComponent, { type SwitchGroupComponentProps } from "./index";

const renderSwitchGroup = (props: Partial<SwitchGroupComponentProps> = {}) => {
  const defaultProps: SwitchGroupComponentProps = {
    accentColor: "#553DE9",
    alignment: Alignment.LEFT,
    compactMode: false,
    disabled: false,
    height: 100,
    inline: true,
    labelText: "Settings",
    onChange: () => jest.fn(),
    options: [
      { label: "Wifi", value: "wifi" },
      { label: "Bluetooth", value: "bluetooth" },
    ],
    required: false,
    selected: [],
    widgetId: "switch-group-widget",
  };

  return render(
    <ThemeProvider theme={lightTheme}>
      <SwitchGroupComponent {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe("SwitchGroupComponent required marker", () => {
  it.each([true, false])(
    "renders the required marker when required is true (inline: %s)",
    (inline) => {
      renderSwitchGroup({ inline, required: true });

      expect(screen.getByLabelText("(required)")).toBeInTheDocument();
    },
  );

  it("does not render the required marker when required is false", () => {
    renderSwitchGroup({ required: false });

    expect(screen.queryByLabelText("(required)")).not.toBeInTheDocument();
  });
});
