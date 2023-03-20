import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import {
  getBasePropertyPath,
  showByColumnType,
  hideByColumnType,
  getColumnPath,
} from "../../propertyUtils";

export default {
  sectionName: "Events",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    if (showByColumnType(props, propertyPath, [ColumnTypes.IMAGE], true)) {
      return false;
    } else {
      const columnType = get(props, `${propertyPath}.columnType`, "");
      const isEditable = get(props, `${propertyPath}.isEditable`, "");
      return (
        !(
          columnType === ColumnTypes.TEXT ||
          columnType === ColumnTypes.NUMBER ||
          columnType === ColumnTypes.CHECKBOX ||
          columnType === ColumnTypes.SWITCH ||
          columnType === ColumnTypes.SELECT ||
          columnType === ColumnTypes.DATE
        ) || !isEditable
      );
    }
  },
  children: [
    // Image onClick
    {
      propertyName: "onClick",
      label: "onClick",
      helpText: "Triggers an action when user clicks on an image",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        return columnType !== ColumnTypes.IMAGE;
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onSubmit",
      label: "onSubmit",
      helpText:
        "Triggers an action when the user presses enter or clicks outside the input box",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        const isEditable = get(props, `${baseProperty}.isEditable`, "");
        return (
          !(
            columnType === ColumnTypes.TEXT || columnType === ColumnTypes.NUMBER
          ) || !isEditable
        );
      },
      dependencies: ["primaryColumns", "inlineEditingSaveOption"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onOptionChange",
      label: "onOptionChange",
      helpText: "Triggers an action when user changes an option",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        const isEditable = get(props, `${baseProperty}.isEditable`, "");
        return columnType !== ColumnTypes.SELECT || !isEditable;
      },
      dependencies: ["primaryColumns"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onCheckChange",
      label: "onChange",
      helpText: "Triggers an action when the check state is changed",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.SWITCH]);
      },
      dependencies: ["primaryColumns"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onCheckChange",
      label: "onCheckChange",
      helpText: "Triggers an action when the check state is changed",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.CHECKBOX]);
      },
      dependencies: ["primaryColumns"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onFilterUpdate",
      helpText: "Trigger an action on change of filterText",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        const isEditable = get(props, `${baseProperty}.isEditable`, "");
        const serverSideFiltering = get(
          props,
          `${baseProperty}.serverSideFiltering`,
          false,
        );
        return (
          columnType !== ColumnTypes.SELECT ||
          !isEditable ||
          !serverSideFiltering
        );
      },
      dependencies: ["primaryColumns"],
      label: "onFilterUpdate",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      additionalAutoComplete: () => ({
        filterText: "",
      }),
    },
    {
      propertyName: "onDateSelected",
      label: "onDateSelected",
      helpText: "Triggers an action when a date is selected in the calendar",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
      dependencies: ["primaryColumns"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const path = getColumnPath(propertyPath);
        return hideByColumnType(props, path, [ColumnTypes.DATE], true);
      },
    },
  ],
};
