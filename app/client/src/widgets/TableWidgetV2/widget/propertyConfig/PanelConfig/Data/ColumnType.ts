import {
  ColumnTypes,
  HTML_COLUMN_TYPE_ENABLED,
  type TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";

import Widget from "../../../index";
import {
  showByColumnType,
  updateCurrencyDefaultValues,
  updateMenuItemsSource,
  updateNumberColumnTypeTextAlignment,
  updateThemeStylesheetsInColumns,
} from "../../../propertyUtils";
const ColumnTypeOptions = [
  {
    label: "Button",
    value: ColumnTypes.BUTTON,
  },
  {
    label: "Checkbox",
    value: ColumnTypes.CHECKBOX,
  },
  {
    label: "Currency",
    value: ColumnTypes.CURRENCY,
  },
  {
    label: "Date",
    value: ColumnTypes.DATE,
  },
  {
    label: "Icon button",
    value: ColumnTypes.ICON_BUTTON,
  },
  {
    label: "Image",
    value: ColumnTypes.IMAGE,
  },
  {
    label: "Menu button",
    value: ColumnTypes.MENU_BUTTON,
  },
  {
    label: "Number",
    value: ColumnTypes.NUMBER,
  },
  {
    label: "Plain text",
    value: ColumnTypes.TEXT,
  },
  {
    label: "Select",
    value: ColumnTypes.SELECT,
  },
  {
    label: "Switch",
    value: ColumnTypes.SWITCH,
  },
  {
    label: "URL",
    value: ColumnTypes.URL,
  },
  {
    label: "Video",
    value: ColumnTypes.VIDEO,
  },
];

// TODO: @rahulbarwal Remove this once we have a feature flag for this
// This is a temporary solution to position the HTML column type alphabetically
const columnTypeWithHtml = [
  ...ColumnTypeOptions.slice(0, 4),
  { label: "HTML", value: ColumnTypes.HTML },
  ...ColumnTypeOptions.slice(4),
];

export const columnTypeConfig = {
  propertyName: "columnType",
  label: "Column type",
  helpText:
    "Type of column to be shown corresponding to the data of the column",
  controlType: "DROP_DOWN",
  // TODO: Remove this once we have a feature flag for this
  // Since we want to position the column types alphabetically, right now this is hardcoded
  options: ColumnTypeOptions,
  updateHook: composePropertyUpdateHook([
    updateNumberColumnTypeTextAlignment,
    updateThemeStylesheetsInColumns,
    updateMenuItemsSource,
    updateCurrencyDefaultValues,
  ]),
  dependencies: ["primaryColumns", "columnOrder", "childStylesheet"],
  isBindProperty: false,
  isTriggerProperty: false,
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    const isHTMLColumnTypeEnabled = Widget.getFeatureFlag(
      HTML_COLUMN_TYPE_ENABLED,
    );

    return (
      isHTMLColumnTypeEnabled ||
      showByColumnType(props, propertyPath, [ColumnTypes.EDIT_ACTIONS])
    );
  },
};

export const columnTypeWithHtmlConfig = {
  propertyName: "columnType",
  label: "Column type",
  helpText:
    "Type of column to be shown corresponding to the data of the column",
  controlType: "DROP_DOWN",
  // TODO: Remove this once we have a feature flag for this
  // Since we want to position the column types alphabetically, right now this is hardcoded
  options: columnTypeWithHtml,
  updateHook: composePropertyUpdateHook([
    updateNumberColumnTypeTextAlignment,
    updateThemeStylesheetsInColumns,
    updateMenuItemsSource,
    updateCurrencyDefaultValues,
  ]),
  dependencies: ["primaryColumns", "columnOrder", "childStylesheet"],
  isBindProperty: false,
  isTriggerProperty: false,
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    const isHTMLColumnTypeEnabled = Widget.getFeatureFlag(
      HTML_COLUMN_TYPE_ENABLED,
    );

    return (
      !isHTMLColumnTypeEnabled ||
      showByColumnType(props, propertyPath, [ColumnTypes.EDIT_ACTIONS])
    );
  },
};
