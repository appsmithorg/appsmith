import { render, screen, act } from "@testing-library/react";
import { dark, theme } from "constants/DefaultTheme";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import type { MultiSelectWidgetProps } from "./";
import MultiSelectWidget from "./";
import userEvent from "@testing-library/user-event";
import "jest-styled-components";
import "@testing-library/jest-dom";
import { RenderModes } from "constants/WidgetConstants";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";

describe("<MultiSelectWidget />", () => {
  const initialState = {
    ui: {
      appSettingsPane: {
        isOpen: false,
      },
      widgetDragResize: {
        lastSelectedWidget: "Widget1",
        selectedWidgets: ["Widget1"],
      },
      users: {
        featureFlag: {
          data: {},
        },
      },
      propertyPane: {
        isVisible: true,
        widgetId: "Widget1",
      },
      debugger: {
        errors: {},
      },
      editor: {
        isPreviewMode: false,
      },
      widgetReflow: {
        enableReflow: true,
      },
      autoHeightUI: {
        isAutoHeightWithLimitsChanging: false,
      },
      mainCanvas: {
        width: 1159,
      },
      canvasSelection: {
        isDraggingForSelection: false,
      },
    },
    entities: { canvasWidgets: {}, app: { mode: "canvas" } },
  };

  const renderMultiSelectWidget = (props: MultiSelectWidgetProps) => {
    const store = configureStore()(initialState);
    return render(
      <Provider store={store}>
        <ThemeProvider
          theme={{
            ...theme,
            colors: {
              ...theme.colors,
              ...dark,
            },
          }}
        >
          <MultiSelectWidget {...props} />
        </ThemeProvider>
      </Provider>,
    );
  };

  test("should show bg color for selected option", async () => {
    const mockDataWithOptions: MultiSelectWidgetProps = {
      widgetId: "Widget1",
      type: "MULTI_SELECT_WIDGET_V2",
      widgetName: "MultiSelect",
      renderMode: RenderModes.COMPONENT_PANE,
      isLoading: false,
      onOptionChange: "mock-option-change",
      onFilterUpdate: "mock-update",
      updateWidgetMetaProperty: jest.fn(),
      filterText: "",
      onFilterChange: "",
      allowSelectAll: true,
      isDirty: true,
      labelComponentWidth: 150,
      rows: 7,
      columns: 20,
      animateLoading: true,
      labelText: "Label",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 5,
      labelTextSize: "0.875rem",
      sourceData: [
        { name: "Blue", code: "BLUE" },
        { name: "Green", code: "GREEN" },
        { name: "Red", code: "RED" },
      ],
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
      optionLabel: "name",
      optionValue: "code",
      isFilterable: true,
      serverSideFiltering: false,
      defaultOptionValue: [
        {
          label: "Green",
          value: "GREEN",
        },
        {
          label: "Red",
          value: "RED",
        },
      ],
      version: 1,
      isRequired: false,
      isDisabled: false,
      placeholderText: "Select option(s)",
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      selectedOption: {
        label: "Green",
        value: "GREEN",
      },
      selectedOptions: [
        {
          label: "Green",
          value: "GREEN",
        },
        {
          label: "Red",
          value: "RED",
        },
      ],
      selectedOptionValues: ["GREEN", "RED"],
      selectedOptionLabels: ["Green", "Red"],
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isValid: true,
      rtl: false,
      accentColor: "yellow",
    };

    renderMultiSelectWidget(mockDataWithOptions);
    const myCustomSelect = screen.getByRole(/combobox/i);
    await act(async () => userEvent.click(myCustomSelect));
    const selectedOptions = document.getElementsByClassName(
      "rc-select-item-option-selected",
    );
    expect(selectedOptions[0].children[0]).toHaveStyle(`
      background-color: "yellow"`);
  });
});
