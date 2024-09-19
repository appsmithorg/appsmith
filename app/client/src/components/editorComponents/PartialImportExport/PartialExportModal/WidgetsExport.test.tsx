import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import WidgetsExport from "./WidgetsExport";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import {
  getAllWidgetIds,
  mockTblUserInfoWidgetId,
  mockWidgetsProps,
} from "./unitTestUtils";

jest.mock("pages/Editor/Explorer/Widgets/WidgetIcon", () => ({
  __esModule: true,
  default: () => <div />,
}));

describe("<WidgetsExport />", () => {
  const baseProps = {
    selectAllchecked: false,
    selectedWidgetIds: [],
    updateSelectAllChecked: jest.fn(),
    updateSelectedWidgets: jest.fn(),
  };

  const BaseComponentRender = () => (
    <ThemeProvider theme={lightTheme}>
      <WidgetsExport {...baseProps} widgets={mockWidgetsProps} />
    </ThemeProvider>
  );

  it("renders the component with correct props", () => {
    render(<BaseComponentRender />);
    expect(screen.getByText("Select All")).toBeInTheDocument();
    expect(screen.getByText("tbl_userInfo")).toBeInTheDocument();
    expect(screen.getByText("txt_pageTitle")).toBeInTheDocument();
  });

  it('handles "Select All" checkbox click', () => {
    render(<BaseComponentRender />);
    const widgetIds = getAllWidgetIds(mockWidgetsProps);
    const selectAllCheckbox = screen.getByTestId(
      "t--partial-export-modal-widget-select-all",
    );

    fireEvent.click(selectAllCheckbox!);
    expect(baseProps.updateSelectAllChecked).toHaveBeenCalledWith(true);
    expect(baseProps.updateSelectedWidgets).toHaveBeenCalledWith(
      widgetIds.slice(1),
    );
  });

  it('handles "Select All" and widget click', () => {
    render(<BaseComponentRender />);
    const widgetIds = getAllWidgetIds(mockWidgetsProps);
    const selectAllCheckbox = screen.getByTestId(
      "t--partial-export-modal-widget-select-all",
    );
    const widgetCheckbox = screen.getByTestId(
      `t--partial-export-modal-widget-select-${mockTblUserInfoWidgetId}`,
    );

    fireEvent.click(selectAllCheckbox!);
    expect(baseProps.updateSelectAllChecked).toHaveBeenCalledWith(true);
    expect(baseProps.updateSelectedWidgets).toHaveBeenCalledWith(
      widgetIds.slice(1),
    );
    fireEvent.click(widgetCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();
    expect(widgetCheckbox).not.toBeChecked();
  });

  it("handles widget checkbox click", () => {
    render(<WidgetsExport {...baseProps} widgets={mockWidgetsProps} />);
    const widgetCheckbox = screen.getByTestId(
      `t--partial-export-modal-widget-select-${mockTblUserInfoWidgetId}`,
    );

    fireEvent.click(widgetCheckbox);
    expect(baseProps.updateSelectedWidgets).toHaveBeenCalledWith([
      mockTblUserInfoWidgetId,
    ]);
  });
});
