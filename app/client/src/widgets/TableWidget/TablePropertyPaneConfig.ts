import { get } from "lodash";
import { Colors } from "constants/Colors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableWidgetProps } from "./TableWidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function defaultSelectedRowValidation(
  value: unknown,
  props: TableWidgetProps,
  _: any,
) {
  if (props) {
    if (props.multiRowSelection) {
      if (props && !props.multiRowSelection)
        return { isValid: true, parsed: undefined };

      if (_.isString(value)) {
        const trimmed = (value as string).trim();
        try {
          const parsedArray = JSON.parse(trimmed);
          if (Array.isArray(parsedArray)) {
            const sanitized = parsedArray.filter((entry) => {
              return (
                Number.isInteger(parseInt(entry, 10)) &&
                parseInt(entry, 10) > -1
              );
            });
            return { isValid: true, parsed: sanitized };
          } else {
            throw Error("Not a stringified array");
          }
        } catch (e) {
          // If cannot be parsed as an array
          const arrayEntries = trimmed.split(",");
          const result: number[] = [];
          arrayEntries.forEach((entry: string) => {
            if (
              Number.isInteger(parseInt(entry, 10)) &&
              parseInt(entry, 10) > -1
            ) {
              if (!_.isNil(entry)) result.push(parseInt(entry, 10));
            }
          });
          return { isValid: true, parsed: result };
        }
      }
      if (Array.isArray(value)) {
        const sanitized = value.filter((entry) => {
          return (
            Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1
          );
        });
        return { isValid: true, parsed: sanitized };
      }
      if (Number.isInteger(value) && (value as number) > -1) {
        return { isValid: true, parsed: [value] };
      }
      return {
        isValid: false,
        parsed: [],
        message: `This value does not match type: number[]`,
      };
    } else {
      try {
        const _value: string = value as string;
        if (Number.isInteger(parseInt(_value, 10)) && parseInt(_value, 10) > -1)
          return { isValid: true, parsed: parseInt(_value, 10) };

        return {
          isValid: true,
          parsed: -1,
        };
      } catch (e) {
        return {
          isValid: true,
          parsed: -1,
        };
      }
    }
  }
  return {
    isValid: true,
    parsed: value,
  };
}

// A hook to update all column styles when global table styles are updated
const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const { primaryColumns, derivedColumns = {} } = props;
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  const tokens = propertyPath.split("."); // horizontalAlignment/textStyle
  const currentStyleName = tokens[0];
  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (primaryColumns && currentStyleName) {
    // The style being updated currently

    // for each primary column
    Object.values(primaryColumns).map((column: ColumnProperties) => {
      // Current column property path
      const propertyPath = `primaryColumns.${column.id}.${currentStyleName}`;
      // Is current column a derived column
      const isDerived = primaryColumns[column.id].isDerived;

      // If it is a derived column and it exists in derivedColumns
      if (isDerived && derivedColumns[column.id]) {
        propertiesToUpdate.push({
          propertyPath: `derivedColumns.${column.id}.${currentStyleName}`,
          propertyValue: propertyValue,
        });
      }
      // Is this a dynamic binding property?
      const notADynamicBinding =
        !props.dynamicBindingPathList ||
        props.dynamicBindingPathList.findIndex(
          (item) => item.key === propertyPath,
        ) === -1;

      if (notADynamicBinding) {
        propertiesToUpdate.push({
          propertyPath: `primaryColumns.${column.id}.${currentStyleName}`,
          propertyValue: propertyValue,
        });
      }
    });
    if (propertiesToUpdate.length > 0) return propertiesToUpdate;
  }
  return;
};

// A hook for handling property updates when the primaryColumns
// has changed and it is supposed to update the derivedColumns
// For example, when we add a new column or update a derived column's name
// The propertyPath will be of the type `primaryColumns.columnId`
const updateDerivedColumnsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  let propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  if (props && propertyValue) {
    // If we're adding a column, we need to add it to the `derivedColumns` property as well
    if (/^primaryColumns\.\w+$/.test(propertyPath)) {
      const newId = propertyValue.id;
      if (newId) {
        propertiesToUpdate = [
          {
            propertyPath: `derivedColumns.${newId}`,
            propertyValue,
          },
        ];
      }

      const oldColumnOrder = props.columnOrder || [];
      const newColumnOrder = [...oldColumnOrder, propertyValue.id];
      propertiesToUpdate.push({
        propertyPath: "columnOrder",
        propertyValue: newColumnOrder,
      });
    }
    // If we're updating a columns' name, we need to update the `derivedColumns` property as well.
    const regex = /^primaryColumns\.(\w+)\.(.*)$/;
    if (regex.test(propertyPath)) {
      const matches = propertyPath.match(regex);
      if (matches && matches.length === 3) {
        const columnId = parseInt(matches[1]);
        const columnProperty = matches[2];
        const primaryColumn = props.primaryColumns[columnId];
        const isDerived = primaryColumn ? primaryColumn.isDerived : false;

        const { derivedColumns = {} } = props;

        if (isDerived && derivedColumns && derivedColumns[columnId]) {
          propertiesToUpdate = [
            {
              propertyPath: `derivedColumns.${columnId}.${columnProperty}`,
              propertyValue: propertyValue,
            },
          ];
        }
      }
    }
    if (propertiesToUpdate.length > 0) return propertiesToUpdate;
  }
  return;
};
// Gets the base property path excluding the current property.
// For example, for  `primaryColumns[5].computedValue` it will return
// `primaryColumns[5]`
const getBasePropertyPath = (propertyPath: string): string | undefined => {
  try {
    const propertyPathRegex = /^(.*)\.\w+$/g;
    const matches = [...propertyPath.matchAll(propertyPathRegex)][0];
    if (matches && Array.isArray(matches) && matches.length === 2) {
      return matches[1];
    }
    return;
  } catch (e) {
    return;
  }
};

export default [
  {
    sectionName: "General",
    children: [
      {
        helpText:
          "Takes in an array of objects to display rows in the table. Bind data from an API using {{}}",
        propertyName: "tableData",
        label: "Table Data",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter [{ "col1": "val1" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.OBJECT_ARRAY,
          params: {
            default: [],
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Columns",
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS",
        label: "Columns",
        updateHook: updateDerivedColumnsHook,
        dependencies: ["derivedColumns", "columnOrder"],
        isBindProperty: false,
        isTriggerProperty: false,
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: updateDerivedColumnsHook,
          dependencies: ["primaryColumns", "derivedColumns", "columnOrder"],
          children: [
            {
              sectionName: "Column Control",
              children: [
                {
                  propertyName: "columnType",
                  label: "Column Type",
                  controlType: "DROP_DOWN",
                  customJSControl: "COMPUTE_VALUE",
                  options: [
                    {
                      label: "Plain Text",
                      value: "text",
                    },
                    {
                      label: "URL",
                      value: "url",
                    },
                    {
                      label: "Number",
                      value: "number",
                    },
                    {
                      label: "Image",
                      value: "image",
                    },
                    {
                      label: "Video",
                      value: "video",
                    },
                    {
                      label: "Date",
                      value: "date",
                    },
                    {
                      label: "Button",
                      value: "button",
                    },
                  ],
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: false,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "displayText",
                  label: "Display Text",
                  controlType: "COMPUTE_VALUE",
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "url";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: false,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "computedValue",
                  label: "Computed Value",
                  controlType: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType === "button";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "isCellVisible",
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnType",
                  ],
                  label: "Visible",
                  helpText: "Controls the visibility of the cell in the column",
                  updateHook: updateDerivedColumnsHook,
                  defaultValue: true,
                  controlType: "SWITCH",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "inputFormat",
                  label: "Original Date Format",
                  controlType: "DROP_DOWN",
                  options: [
                    {
                      label: "UNIX timestamp (s)",
                      value: "Epoch",
                    },
                    {
                      label: "UNIX timestamp (ms)",
                      value: "Milliseconds",
                    },
                    {
                      label: "YYYY-MM-DD",
                      value: "YYYY-MM-DD",
                    },
                    {
                      label: "YYYY-MM-DD HH:mm",
                      value: "YYYY-MM-DD HH:mm",
                    },
                    {
                      label: "ISO 8601",
                      value: "YYYY-MM-DDTHH:mm:ss.sssZ",
                    },
                    {
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                    {
                      label: "Do MMM YYYY",
                      value: "Do MMM YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY HH:mm",
                      value: "DD/MM/YYYY HH:mm",
                    },
                    {
                      label: "LLL",
                      value: "LLL",
                    },
                    {
                      label: "LL",
                      value: "LL",
                    },
                    {
                      label: "D MMMM, YYYY",
                      value: "D MMMM, YYYY",
                    },
                    {
                      label: "H:mm A D MMMM, YYYY",
                      value: "H:mm A D MMMM, YYYY",
                    },
                    {
                      label: "MM-DD-YYYY",
                      value: "MM-DD-YYYY",
                    },
                    {
                      label: "DD-MM-YYYY",
                      value: "DD-MM-YYYY",
                    },
                    {
                      label: "MM/DD/YYYY",
                      value: "MM/DD/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YY",
                      value: "DD/MM/YY",
                    },
                    {
                      label: "MM/DD/YY",
                      value: "MM/DD/YY",
                    },
                  ],
                  defaultValue: "YYYY-MM-DD HH:mm",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "outputFormat",
                  label: "Display Date Format",
                  controlType: "DROP_DOWN",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  options: [
                    {
                      label: "UNIX timestamp (s)",
                      value: "Epoch",
                    },
                    {
                      label: "UNIX timestamp (ms)",
                      value: "Milliseconds",
                    },
                    {
                      label: "YYYY-MM-DD",
                      value: "YYYY-MM-DD",
                    },
                    {
                      label: "YYYY-MM-DD HH:mm",
                      value: "YYYY-MM-DD HH:mm",
                    },
                    {
                      label: "ISO 8601",
                      value: "YYYY-MM-DDTHH:mm:ss.sssZ",
                    },
                    {
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                    {
                      label: "Do MMM YYYY",
                      value: "Do MMM YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY HH:mm",
                      value: "DD/MM/YYYY HH:mm",
                    },
                    {
                      label: "LLL",
                      value: "LLL",
                    },
                    {
                      label: "LL",
                      value: "LL",
                    },
                    {
                      label: "D MMMM, YYYY",
                      value: "D MMMM, YYYY",
                    },
                    {
                      label: "H:mm A D MMMM, YYYY",
                      value: "H:mm A D MMMM, YYYY",
                    },
                    {
                      label: "MM-DD-YYYY",
                      value: "MM-DD-YYYY",
                    },
                    {
                      label: "DD-MM-YYYY",
                      value: "DD-MM-YYYY",
                    },
                    {
                      label: "MM/DD/YYYY",
                      value: "MM/DD/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YY",
                      value: "DD/MM/YY",
                    },
                    {
                      label: "MM/DD/YY",
                      value: "MM/DD/YY",
                    },
                  ],
                  defaultValue: "YYYY-MM-DD HH:mm",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnType",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "image";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: true,
                },
              ],
            },
            {
              sectionName: "Styles",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const columnType = get(props, `${propertyPath}.columnType`, "");

                return (
                  columnType === "button" ||
                  columnType === "image" ||
                  columnType === "video"
                );
              },
              dependencies: ["primaryColumns", "derivedColumns"],
              children: [
                {
                  propertyName: "horizontalAlignment",
                  label: "Text Align",
                  controlType: "ICON_TABS",
                  options: [
                    {
                      icon: "LEFT_ALIGN",
                      value: "LEFT",
                    },
                    {
                      icon: "CENTER_ALIGN",
                      value: "CENTER",
                    },
                    {
                      icon: "RIGHT_ALIGN",
                      value: "RIGHT",
                    },
                  ],
                  defaultValue: "LEFT",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "textSize",
                  label: "Text Size",
                  controlType: "DROP_DOWN",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  options: [
                    {
                      label: "Heading 1",
                      value: "HEADING1",
                      subText: "24px",
                      icon: "HEADING_ONE",
                    },
                    {
                      label: "Heading 2",
                      value: "HEADING2",
                      subText: "18px",
                      icon: "HEADING_TWO",
                    },
                    {
                      label: "Heading 3",
                      value: "HEADING3",
                      subText: "16px",
                      icon: "HEADING_THREE",
                    },
                    {
                      label: "Paragraph",
                      value: "PARAGRAPH",
                      subText: "14px",
                      icon: "PARAGRAPH",
                    },
                    {
                      label: "Paragraph 2",
                      value: "PARAGRAPH2",
                      subText: "12px",
                      icon: "PARAGRAPH_TWO",
                    },
                  ],
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "fontStyle",
                  label: "Font Style",
                  controlType: "BUTTON_TABS",
                  options: [
                    {
                      icon: "BOLD_FONT",
                      value: "BOLD",
                    },
                    {
                      icon: "ITALICS_FONT",
                      value: "ITALIC",
                    },
                  ],
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "verticalAlignment",
                  label: "Vertical Alignment",
                  controlType: "ICON_TABS",
                  options: [
                    {
                      icon: "VERTICAL_TOP",
                      value: "TOP",
                    },
                    {
                      icon: "VERTICAL_CENTER",
                      value: "CENTER",
                    },
                    {
                      icon: "VERTICAL_BOTTOM",
                      value: "BOTTOM",
                    },
                  ],
                  defaultValue: "LEFT",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "textColor",
                  label: "Text Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "cellBackground",
                  label: "Cell Background",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
              ],
            },
            {
              sectionName: "Button Properties",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const columnType = get(props, `${propertyPath}.columnType`, "");
                return columnType !== "button";
              },
              children: [
                {
                  propertyName: "isDisabled",
                  label: "Disabled",
                  updateHook: updateDerivedColumnsHook,
                  defaultValue: false,
                  controlType: "SWITCH",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "buttonLabel",
                  label: "Label",
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Action",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "buttonStyle",
                  label: "Button Color",
                  controlType: "COLOR_PICKER",
                  helpText: "Changes the color of the button",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.GREEN,
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "buttonLabelColor",
                  label: "Label Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.WHITE,
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  helpText: "Triggers an action when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  additionalAutoComplete: (props: TableWidgetProps) => ({
                    currentRow: Object.assign(
                      {},
                      ...Object.keys(props.primaryColumns).map((key) => ({
                        [key]: "",
                      })),
                    ),
                  }),
                  isJSConvertible: true,
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: true,
                },
              ],
            },
          ],
        },
      },
      {
        propertyName: "defaultSearchText",
        label: "Default Search Text",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter default search text",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Selects row(s) by default",
        propertyName: "defaultSelectedRow",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter row index",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultSelectedRowValidation,
            expected: {
              type: "Index of row(s)",
              example: "0 | [0, 1]",
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        dependencies: ["multiRowSelection"],
      },
      {
        helpText:
          "Bind the Table.pageNo property in your API and call it onPageChange",
        propertyName: "serverSidePaginationEnabled",
        label: "Server Side Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        isJSConvertible: true,
        label: "Visible",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "multiRowSelection",
        label: "Enable multi row selection",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Actions",
    children: [
      {
        helpText: "Triggers an action when a table row is selected",
        propertyName: "onRowSelected",
        label: "onRowSelected",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when a table page is changed",
        propertyName: "onPageChange",
        label: "onPageChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when a table page size is changed",
        propertyName: "onPageSizeChange",
        label: "onPageSizeChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        propertyName: "onSearchTextChanged",
        label: "onSearchTextChanged",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
  {
    sectionName: "Header options",
    children: [
      {
        helpText: "Toggle visibility of the search box",
        propertyName: "isVisibleSearch",
        label: "Search",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Toggle visibility of the filters",
        propertyName: "isVisibleFilters",
        label: "Filters",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Toggle visibility of the data download",
        propertyName: "isVisibleDownload",
        label: "Download",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Toggle visibility of the row height",
        propertyName: "isVisibleCompactMode",
        label: "Row Height",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Toggle visibility of the pagination",
        propertyName: "isVisiblePagination",
        label: "Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "delimiter",
        label: "CSV Separator",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter CSV separator",
        helpText: "The character used for separating the CSV download file.",
        isBindProperty: true,
        isTriggerProperty: false,
        defaultValue: ",",
        validation: {
          type: ValidationTypes.TEXT,
        },
        hidden: (props: TableWidgetProps) => !props.isVisibleDownload,
        dependencies: ["isVisibleDownload"],
      },
    ],
  },
  {
    sectionName: "Styles",
    children: [
      {
        propertyName: "cellBackground",
        label: "Cell Background",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textColor",
        label: "Text Color",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textSize",
        label: "Text Size",
        controlType: "DROP_DOWN",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        options: [
          {
            label: "Heading 1",
            value: "HEADING1",
            subText: "24px",
            icon: "HEADING_ONE",
          },
          {
            label: "Heading 2",
            value: "HEADING2",
            subText: "18px",
            icon: "HEADING_TWO",
          },
          {
            label: "Heading 3",
            value: "HEADING3",
            subText: "16px",
            icon: "HEADING_THREE",
          },
          {
            label: "Paragraph",
            value: "PARAGRAPH",
            subText: "14px",
            icon: "PARAGRAPH",
          },
          {
            label: "Paragraph 2",
            value: "PARAGRAPH2",
            subText: "12px",
            icon: "PARAGRAPH_TWO",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "fontStyle",
        label: "Font Style",
        controlType: "BUTTON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        options: [
          {
            icon: "BOLD_FONT",
            value: "BOLD",
          },
          {
            icon: "ITALICS_FONT",
            value: "ITALIC",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "horizontalAlignment",
        label: "Text Align",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        options: [
          {
            icon: "LEFT_ALIGN",
            value: "LEFT",
          },
          {
            icon: "CENTER_ALIGN",
            value: "CENTER",
          },
          {
            icon: "RIGHT_ALIGN",
            value: "RIGHT",
          },
        ],
        defaultValue: "LEFT",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "verticalAlignment",
        label: "Vertical Alignment",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        options: [
          {
            icon: "VERTICAL_TOP",
            value: "TOP",
          },
          {
            icon: "VERTICAL_CENTER",
            value: "CENTER",
          },
          {
            icon: "VERTICAL_BOTTOM",
            value: "BOTTOM",
          },
        ],
        defaultValue: "LEFT",
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
];
