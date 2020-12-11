import { compact, get, isString, xor, xorWith } from "lodash";
import { Colors } from "constants/Colors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import {
  getTableStyles,
  getDefaultColumnProperties,
} from "components/designSystems/appsmith/TableComponent/TableUtilities";
import { TableWidgetProps } from "./TableWidgetConstants";
import log from "loglevel";

const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> => {
  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (props.primaryColumns) {
    // The style being updated currently
    const currentStyleName = propertyPath.split(".").pop(); // horizontalAlignment/textStyle
    let derivedColumns = [];
    if (props.derivedColumns) {
      if (isString(props.derivedColumns)) {
        // why is this a string in the first place?
        try {
          derivedColumns = JSON.parse(props.derivedColumns);
        } catch (e) {
          log.debug("Error parsing derived columns", e);
        }
      } else {
        derivedColumns = props.derivedColumns;
      }
    }
    // const derivedColumns = props.derivedColumns || [];
    let updatedDerivedColumns = [...derivedColumns];
    if (currentStyleName) {
      let updates = compact(
        props.primaryColumns.map((column: ColumnProperties, index: number) => {
          // The property path for the property we intend to update
          const propertyPath = `primaryColumns[${index}].${currentStyleName}`;
          if (
            !props.dynamicBindingPathList ||
            props.dynamicBindingPathList.findIndex(
              item => item.key === propertyPath,
            ) === -1 // if the property path is not a dynamic binding
          ) {
            // if column is derived, update derivedColumns
            if (column.isDerived) {
              updatedDerivedColumns = updatedDerivedColumns.map(
                (derivedColumn: ColumnProperties) => {
                  if (column.id === derivedColumn.id) {
                    derivedColumn = {
                      ...column,
                      [currentStyleName]: propertyValue,
                    };
                  }
                  return derivedColumn;
                },
              );
            }
            return {
              propertyPath,
              propertyValue,
            }; // Have the platform update the value of this property
          }
          return; // Return undefined
        }),
      );
      // if updatedDerivedColumns has changes update the property
      const difference = xorWith(
        derivedColumns,
        updatedDerivedColumns,
        (a, b) => JSON.stringify(a) !== JSON.stringify(b),
      );
      if (difference) {
        updates = [
          ...updates,
          {
            propertyPath: "derivedColumns",
            propertyValue: updatedDerivedColumns,
          },
        ];
      }
      return updates;
    }
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

const updateDerivedColumnHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const derivedColumns = props.derivedColumns || [];
  const propertyPathSplitted = propertyPath.split(".");
  // The column property being updated currently
  const columnProperty = propertyPathSplitted.pop();
  if (columnProperty && propertyPathSplitted[0]) {
    //Get column id from primaryColumns based on propertyPath of column
    const columnId = get(props, propertyPathSplitted[0])?.id;
    const updatedDerivedColumns = derivedColumns.map(
      (column: ColumnProperties) => {
        if (column.id === columnId) {
          column = {
            ...column,
            [columnProperty]: propertyValue,
          };
        }
        return column;
      },
    );
    return [
      {
        propertyPath: "derivedColumns",
        propertyValue: updatedDerivedColumns,
      },
    ];
  }
  return [];
};

const updateDerivedColumnsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (
    props &&
    propertyValue &&
    props[propertyPath] &&
    propertyPath === "primaryColumns"
  ) {
    const propertiesToUpdate = [];
    // Get old list of derviedcolumns
    const oldDerivedColumns = props.derivedColumns || [];
    // Get new list from the primarycolumns
    const newDerivedColumns = propertyValue.filter(
      (column: ColumnProperties) => column.isDerived,
    );

    // check if there is a difference in the two
    const difference: ColumnProperties[] = xorWith(
      oldDerivedColumns,
      newDerivedColumns,
      (a: ColumnProperties, b: ColumnProperties) =>
        a.id === b.id && a.label === b.label,
    );

    if (difference.length > 0) {
      propertiesToUpdate.push({
        propertyPath: "derivedColumns",
        propertyValue: newDerivedColumns,
      });
    }

    const oldColumnOrder = props.columnOrder || [];
    const newColumnIds = propertyValue.map(
      (column: ColumnProperties) => column.id,
    );

    // Check if we have deleted columns
    const newColumnOrder = oldColumnOrder.filter((columnId: string) => {
      return newColumnIds.indexOf(columnId) > -1;
    });

    // Check if we have added columns
    newColumnIds.forEach((columnId: string) => {
      if (newColumnOrder.indexOf(columnId) === -1) {
        newColumnOrder.push(columnId);
      }
    });
    if (xor(newColumnOrder, oldColumnOrder).length > 0) {
      propertiesToUpdate.push({
        propertyPath: "columnOrder",
        propertyValue: newColumnOrder,
      });
    }

    if (propertiesToUpdate.length > 0) {
      return propertiesToUpdate;
    }
  }
  return;
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
        // updateHook: updateColumnsHook,
      },
      {
        helpText: "Columns",
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS",
        label: "Columns",
        updateHook: updateDerivedColumnsHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "date";
                  },
                },
                {
                  propertyName: "computedValue",
                  label: "Computed Value",
                  controlType: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
                },
                {
                  propertyName: "textColor",
                  label: "Text Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.THUNDER,
                  updateHook: updateDerivedColumnHook,
                },
                {
                  propertyName: "cellBackground",
                  label: "Cell Background",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.WHITE,
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
                },
                {
                  propertyName: "buttonStyle",
                  label: "Button Color",
                  controlType: "COLOR_PICKER",
                  helpText: "Changes the color of the button",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.GREEN,
                  updateHook: updateDerivedColumnHook,
                },
                {
                  propertyName: "buttonLabelColor",
                  label: "Label Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  defaultColor: Colors.WHITE,
                  updateHook: updateDerivedColumnHook,
                },
                {
                  helpText: "Triggers an action when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  isJSConvertible: true,
                  updateHook: updateDerivedColumnHook,
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
