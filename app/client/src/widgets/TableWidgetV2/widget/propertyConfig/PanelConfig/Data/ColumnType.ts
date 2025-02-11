import {
  ColumnTypes,
  type TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";

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
    label: "HTML",
    value: ColumnTypes.HTML,
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

export const columnTypeConfig = {
  propertyName: "columnType",
  label: "Column type",
  helpText:
    "Type of column to be shown corresponding to the data of the column",
  controlType: "DROP_DOWN",
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
  hidden: (props: TableWidgetProps, propertyPath: string) =>
    showByColumnType(props, propertyPath, [ColumnTypes.EDIT_ACTIONS]),
};
