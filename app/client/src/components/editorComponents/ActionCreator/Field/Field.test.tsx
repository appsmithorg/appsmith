import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Field } from "./index";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";
import { FieldType } from "../constants";
import { FIELD_CONFIG } from "../FieldConfig";

describe("Field component", () => {
  const commonProps = {
    activeNavigateToTab: {
      action: () => {
        return null;
      },
      id: "page-name",
      text: "Page Name",
    },
    depth: 1,
    integrationOptionTree: [],
    maxDepth: 0,
    modalDropdownList: [],
    navigateToSwitches: [
      {
        id: "page-name",
        text: "Page Name",
        action: () => {
          return null;
        },
      },
      {
        id: "url",
        text: "URL",
        action: () => {
          return null;
        },
      },
    ],
    onValueChange: () => {
      return null;
    },
    pageDropdownOptions: [
      { id: "62d8f2ed3e80f46c3ac16df6", label: "Page1", value: "'Page1'" },
    ],
    widgetOptionTree: [],
  };
  const tests = [
    {
      field: FieldType.ACTION_SELECTOR_FIELD,
      value: "",
      testId: null,
    },
    {
      field: FieldType.ALERT_TEXT_FIELD,
      value: "{{showAlert()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.ALERT_TYPE_SELECTOR_FIELD,
      value: "{{showAlert()}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.KEY_TEXT_FIELD,
      value: "{{storeValue()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.VALUE_TEXT_FIELD,
      value: "{{storeValue()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.QUERY_PARAMS_FIELD,
      value: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.DOWNLOAD_DATA_FIELD,
      value: "{{download()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.DOWNLOAD_FILE_NAME_FIELD,
      value: "{{download()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.COPY_TEXT_FIELD,
      value: "{{copyToClipboard()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.NAVIGATION_TARGET_FIELD,
      value: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.WIDGET_NAME_FIELD,
      value: "{{resetWidget()}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.RESET_CHILDREN_FIELD,
      value: "{{resetWidget()}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.CALLBACK_FUNCTION_FIELD,
      value: "{{setInterval()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.DELAY_FIELD,
      value: "{{setInterval()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.ID_FIELD,
      value: "{{setInterval()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.CLEAR_INTERVAL_ID_FIELD,
      value: "{{clearInterval()}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD,
      value: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      testId: "tabs-label",
    },
    {
      field: FieldType.URL_FIELD,
      value: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      testId: "text-view-label",
    },
    {
      field: FieldType.DOWNLOAD_FILE_TYPE_FIELD,
      value: "{{download()}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.PAGE_SELECTOR_FIELD,
      value: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.CLOSE_MODAL_FIELD,
      value: "{{closeModal()}}",
      testId: "selector-view-label",
    },
    {
      field: FieldType.SHOW_MODAL_FIELD,
      value: "{{showModal()}}",
      testId: "selector-view-label",
    },
  ];

  it("renders the component", () => {
    const props = {
      value: "{{download()}}",
      ...commonProps,
      field: {
        field: FieldType.DOWNLOAD_FILE_TYPE_FIELD,
      },
    };
    render(
      <ThemeProvider theme={lightTheme}>
        <Field {...props} />
      </ThemeProvider>,
    );
  });

  test.each(tests.map((x, index) => [index, x.field, x.value, x.testId]))(
    "test case %d",
    (index, field, value, testId) => {
      const props = {
        ...commonProps,
        field: {
          field: field as FieldType,
        },
        value: value as string,
      };
      const expectedLabel = FIELD_CONFIG[field as FieldType].label(props);
      const expectedDefaultText = FIELD_CONFIG[field as FieldType].defaultText;
      render(
        <ThemeProvider theme={lightTheme}>
          <Field {...props} />
        </ThemeProvider>,
      );
      if (testId && expectedLabel) {
        expect(screen.getByTestId(testId)).toHaveTextContent(expectedLabel);
      }
      if (expectedDefaultText) {
        expect(screen.getByText(expectedDefaultText)).toBeInTheDocument();
      }
    },
  );
});
