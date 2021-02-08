import { compact, get, xorWith } from "lodash";
import { Colors } from "constants/Colors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableWidgetProps } from "./TableWidgetConstants";

const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (props.primaryColumns) {
    // The style being updated currently
    const currentStyleName = propertyPath.split(".").pop(); // horizontalAlignment/textStyle
    const derivedColumns = props.derivedColumns;
    let updatedDerivedColumns = [...(derivedColumns || [])];
    if (currentStyleName) {
      let updates = compact(
        props.primaryColumns.map((column: ColumnProperties, index: number) => {
          // The property path for the property we intend to update
          const propertyPath = `primaryColumns[${index}].${currentStyleName}`;
          if (
            !props.dynamicBindingPathList ||
            props.dynamicBindingPathList.findIndex(
              (item) => item.key === propertyPath,
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
  }
  return;
};

const updateDerivedColumnHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const regex = /primaryColumns\[(\d+)\]\.(.*)/;
  let updatedPrimaryColumnIndex = -1;
  let columnPropertyBeingUpdated: string | undefined = undefined;
  if (regex.test(propertyPath)) {
    const matches = propertyPath.match(regex);
    if (matches && Array.isArray(matches)) {
      if (matches[1] && matches[1].length > 0)
        updatedPrimaryColumnIndex = parseInt(matches[1], 10);
      if (matches[2] && matches[2].length > 0)
        columnPropertyBeingUpdated = matches[2];
    }
  }
  if (updatedPrimaryColumnIndex > -1) {
    const updatedPrimaryColumn =
      props.primaryColumns[updatedPrimaryColumnIndex];
    if (updatedPrimaryColumn && updatedPrimaryColumn.isDerived) {
      const derivedColumnIndex = props.derivedColumns?.findIndex(
        (column: ColumnProperties) => column.id === updatedPrimaryColumn.id,
      );
      if (derivedColumnIndex > -1 && columnPropertyBeingUpdated) {
        const derivedColumn = { ...props.derivedColumns[derivedColumnIndex] };
        derivedColumn[columnPropertyBeingUpdated] = propertyValue;
        const derivedColumns = [...(props.derivedColumns || [])];
        derivedColumns[derivedColumnIndex] = derivedColumn;
        return [
          {
            propertyPath: `derivedColumns`,
            propertyValue: derivedColumns,
          },
        ];
      }
    }
  }
  return;
};

const updateDerivedColumnsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (props && propertyValue) {
    // If we're adding a column, we need to add it to the `derivedColumns` property as well
    if (/primaryColumns\[\d+\]$/.test(propertyPath)) {
      const derivedColumnIndex = props.derivedColumns.length;
      const propertiesToUpdate = [
        {
          propertyPath: `derivedColumns[${derivedColumnIndex}]`,
          propertyValue,
        },
      ];

      const oldColumnOrder = props.columnOrder || [];
      const newColumnOrder = [...oldColumnOrder, propertyValue.id];
      propertiesToUpdate.push({
        propertyPath: "columnOrder",
        propertyValue: newColumnOrder,
      });
      if (propertiesToUpdate.length > 0) {
        return propertiesToUpdate;
      }
    }
    // If we're updating a columns' name, we need to update the `derivedColumns` property as well.
    const regex = /primaryColumns\[(\d+)\]\.(.*)$/;
    if (regex.test(propertyPath)) {
      const matches = propertyPath.match(regex);
      if (matches && matches.length === 3) {
        const primaryColumnIndex = parseInt(matches[1]);
        const columnProperty = matches[2];
        const primaryColumn = props.primaryColumns[primaryColumnIndex];
        const derivedColumnIndex = props.derivedColumns?.findIndex(
          (column: ColumnProperties) => {
            return column.id === primaryColumn.id;
          },
        );

        if (derivedColumnIndex > -1) {
          return [
            {
              propertyPath: `derivedColumns[${derivedColumnIndex}].${columnProperty}`,
              propertyValue: propertyValue,
            },
          ];
        }
      }
    }
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
      },
      {
        helpText: "Columns",
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS",
        label: "Columns",
        updateHook: updateDerivedColumnsHook,
        isBindProperty: false,
        isTriggerProperty: false,
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: updateDerivedColumnHook,
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
                      label: "Button",
                      value: "button",
                    },
                  ],
                  updateHook: updateDerivedColumnHook,
                  isBindProperty: false,
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
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
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
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "computedValue",
                  label: "Computed Value",
                  controlType: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType === "button";
                  },
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
              ],
            },
            {
              sectionName: "Styles",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const baseProperty = getBasePropertyPath(propertyPath);

                const columnType = get(
                  props,
                  `${baseProperty || propertyPath}.columnType`,
                  "",
                );

                return (
                  columnType === "button" ||
                  columnType === "image" ||
                  columnType === "video"
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "textColor",
                  label: "Text Color",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnHook,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "cellBackground",
                  label: "Cell Background",
                  controlType: "COLOR_PICKER",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnHook,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
              ],
            },
            {
              sectionName: "Button Properties",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const baseProperty = getBasePropertyPath(propertyPath);
                const columnType = get(
                  props,
                  `${baseProperty || propertyPath}.columnType`,
                  "",
                );
                return columnType !== "button";
              },
              children: [
                {
                  propertyName: "buttonLabel",
                  label: "Label",
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Action",
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
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
                  updateHook: updateDerivedColumnHook,
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  helpText: "Triggers an action when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  updateHook: updateDerivedColumnHook,
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
      },
      {
        helpText: "Selects the default selected row",
        propertyName: "defaultSelectedRow",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter row index",
        isBindProperty: true,
        isTriggerProperty: false,
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
    sectionName: "Styles",
    children: [
      {
        propertyName: "cellBackground",
        label: "Cell Background",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textColor",
        label: "Text Color",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textSize",
        label: "Text Size",
        controlType: "DROP_DOWN",
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
