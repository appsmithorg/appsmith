import React from "react";
import { WidgetIcons } from "./WidgetIcons";
import { render, screen } from "@testing-library/react";

import { ThemeProvider, theme } from "constants/DefaultTheme";

const ListWidgetIcon = WidgetIcons["LIST_WIDGET"];

describe("WidgetIcons", () => {
  it("checks widget icon for list widget", () => {
    render(
      <ThemeProvider theme={theme}>
        <ListWidgetIcon background="red" />
      </ThemeProvider>,
    );

    const input = screen.queryByTestId("list-widget-icon");
    expect(input).toBeTruthy();
  });
});
