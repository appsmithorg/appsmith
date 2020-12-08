import { compact, get } from "lodash";
import { Colors } from "constants/Colors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import {
  getTableStyles,
  getDefaultColumnProperties,
} from "components/designSystems/appsmith/TableComponent/TableUtilities";
import { TableWidgetProps } from "./TableWidgetConstants";

const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> => {
  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (props.primaryColumns) {
    // The style being updated currently
    const currentStyleName = propertyPath.split(".").pop(); // horizontalAlignment/textStyle
    return compact(
      props.primaryColumns.map((column: ColumnProperties, index: number) => {
        // The property path for the property we intend to update
        const propertyPath = `primaryColumns[${index}].${currentStyleName}`;
        if (
          !props.dynamicBindingPathList ||
          props.dynamicBindingPathList.findIndex(
            item => item.key === propertyPath,
          ) === -1 // if the property path is not a dynamic binding
        ) {
          return {
            propertyPath,
            propertyValue,
          }; // Have the platform update the value of this property
        }
        return; // Return undefined
      }),
    );
    // .filter(Boolean); // Remove all undefined entries
  }
  return [];
};

const updateColumnsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  try {
    // Parse the json in the field
    const tableData = JSON.parse(propertyValue);
    // Get all the column keys
    const columnKeys: string[] = getAllTableColumnKeys(tableData);
    // Get all the primary columns
    const primaryColumns: ColumnProperties[] = props.primaryColumns
      ? [...props.primaryColumns]
      : [];
    // Get all table level styles
    const tableStyles = getTableStyles(props);
    let existingColumnCount = 0;
    // Use the columnId as identifier instead of index
    const dynamicBindingPathList = props.dynamicBindingPathList
      ? props.dynamicBindingPathList.map((item: { key: string }) => {
          const value = item.key;
          if (value.includes("primaryColumns")) {
            const columnId = get(
              { primaryColumns },
              `${value.split(".")[0]}.id`,
            );
            return {
              key: `primaryColumns.${columnId}.${value.split(".")[1]}`,
            };
          }
          return item;
        })
      : [];
    // Get all the existing columns which are either derived or exist in primary columns
    const existingColumns = primaryColumns.filter(
      (column: ColumnProperties) => {
        // Index of the column.id in all table column keys
        const columnKeyIndex = columnKeys.indexOf(column.id);
        // If this column exists in the column keys of the table
        if (columnKeyIndex > -1) {
          // Remove this column from columnKeys
          columnKeys.splice(columnKeyIndex, 1);
          // Leverage the fact that filter iterates to increment the count of existing columns
          existingColumnCount++;
        }
        // Return true if this column is a derived column or the column is not found
        return column.isDerived || columnKeyIndex !== -1;
      },
    );
    for (let i = 0; i < columnKeys.length; i++) {
      const column = getDefaultColumnProperties(
        columnKeys[i],
        0,
        props.widgetName,
      );
      existingColumns.splice(existingColumnCount + i, 0, {
        ...column,
        ...tableStyles,
      });
    }
    const columns = existingColumns.map(
      (column: ColumnProperties, index: number) => {
        return {
          ...column,
          index: index,
        };
      },
    );
    const updatedDynamicBindingPathList = compact(
      dynamicBindingPathList.map((item: { key: string }) => {
        const value = item.key;
        if (value.includes("primaryColumns")) {
          const columnId = value.split(".")[1];
          const columnIndex = columns.findIndex(
            (column: ColumnProperties) => column.id === columnId,
          );
          if (columnIndex !== -1) {
            return {
              key: `primaryColumns[${columnIndex}].${value.split(".")[2]}`,
            };
          }
          return;
        }
        return item;
      }),
    );

    propertiesToUpdate.push(
      {
        propertyPath: "primaryColumns",
        propertyValue: columns,
      },
      {
        propertyPath: "dynamicBindingPathList",
        propertyValue: updatedDynamicBindingPathList,
      },
    );
    return propertiesToUpdate;
  } catch (err) {
    // There was most likely, a parsing error
    // Reset the primary columns, as new data is coming in
    return [
      {
        propertyPath: "primaryColumns",
        propertyValue: [],
      },
    ];
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
        updateHook: updateColumnsHook,
      },
      {
        helpText: "Columns",
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS",
        label: "Columns",
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
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
                      label: "Time",
                      value: "time",
                    },
                    {
                      label: "Currency",
                      value: "currencys",
                    },
                    {
                      label: "Button",
                      value: "button",
                    },
                  ],
                },
                {
                  propertyName: "outputFormat",
                  label: "Currency Type",
                  controlType: "DROP_DOWN",
                  options: [
                    {
                      label: "USD - $",
                      value: "$",
                    },
                    {
                      label: "INR - ₹",
                      value: "₹",
                    },
                    {
                      label: "GBP - £",
                      value: "£",
                    },
                    {
                      label: "AUD - A$",
                      value: "A$",
                    },
                    {
                      label: "EUR - €",
                      value: "€",
                    },
                    {
                      label: "SGD - S$",
                      value: "S$",
                    },
                    {
                      label: "CAD - C$",
                      value: "C$",
                    },
                  ],
                  customJSControl: "COMPUTE_VALUE",
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "currency";
                  },
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
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                  ],
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "date";
                  },
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
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                    {
                      label: "DD-MM-YYYY HH:mm",
                      value: "DD-MM-YYYY HH:mm",
                    },
                    {
                      label: "DD-MM-YYYY",
                      value: "DD-MM-YYYY",
                    },
                    {
                      label: "Do MMM YYYY",
                      value: "Do MMM YYYY",
                    },
                  ],
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "date";
                  },
                },
                {
                  propertyName: "computedValue",
                  label: "Computed Value",
                  controlType: "COMPUTE_VALUE",
                  hidden: (props: ColumnProperties) => {
                    return props.columnType === "button";
                  },
                },
              ],
            },
            {
              sectionName: "Text",
              hidden: (props: ColumnProperties) => {
                return (
                  props.columnType === "button" ||
                  props.columnType === "dropdown"
                );
              },
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
                      label: "Bullet Points",
                      value: "BULLETPOINTS",
                      subText: "14px",
                      icon: "BULLETS",
                    },
                  ],
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
                },
                {
                  propertyName: "textColor",
                  label: "Text Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.THUNDER,
                },
                {
                  propertyName: "cellBackground",
                  label: "Cell Background",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.WHITE,
                },
              ],
            },
            {
              sectionName: "Button Properties",
              hidden: (props: ColumnProperties) => {
                return props.columnType !== "button";
              },
              children: [
                {
                  propertyName: "buttonLabel",
                  label: "Label",
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Action",
                },
                {
                  propertyName: "buttonStyle",
                  label: "Button Color",
                  controlType: "COLOR_PICKER",
                  helpText: "Changes the color of the button",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.GREEN,
                },
                {
                  propertyName: "buttonLabelColor",
                  label: "Label Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.WHITE,
                },
                {
                  helpText: "Triggers an action when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  isJSConvertible: true,
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
      },
      {
        helpText: "Selects the default selected row",
        propertyName: "defaultSelectedRow",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter row index",
      },
      {
        helpText:
          "Bind the Table.pageNo property in your API and call it onPageChange",
        propertyName: "serverSidePaginationEnabled",
        label: "Server Side Pagination",
        controlType: "SWITCH",
      },
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        isJSConvertible: true,
        label: "Visible",
        controlType: "SWITCH",
      },
      {
        propertyName: "multiRowSelection",
        label: "Enable multi row selection",
        controlType: "SWITCH",
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
        isJSConvertible: true,
        defaultColor: Colors.WHITE,
        updateHook: updateColumnStyles,
      },
      {
        propertyName: "textColor",
        label: "Text Color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        defaultColor: Colors.THUNDER,
        updateHook: updateColumnStyles,
      },
      {
        propertyName: "textSize",
        label: "Text Size",
        controlType: "DROP_DOWN",
        isJSConvertible: true,
        updateHook: updateColumnStyles,
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
            label: "Bullet Points",
            value: "BULLETPOINTS",
            subText: "14px",
            icon: "BULLETS",
          },
        ],
      },
      {
        propertyName: "fontStyle",
        label: "Font Style",
        controlType: "BUTTON_TABS",
        updateHook: updateColumnStyles,
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
      },
      {
        propertyName: "horizontalAlignment",
        label: "Text Align",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,

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
      },
      {
        propertyName: "verticalAlignment",
        label: "Vertical Alignment",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,
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
      },
      {
        helpText: "Triggers an action when a table page is changed",
        propertyName: "onPageChange",
        label: "onPageChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
      },
      {
        propertyName: "onSearchTextChanged",
        label: "onSearchTextChanged",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
      },
    ],
  },
];
