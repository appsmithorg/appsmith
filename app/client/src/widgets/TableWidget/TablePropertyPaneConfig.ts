import { get } from "lodash";
import { Colors } from "constants/Colors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableWidgetProps } from "./TableWidgetConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

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
        validation: VALIDATION_TYPES.TABLE_DATA,
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
          updateHook: updateDerivedColumnsHook,
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
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
              ],
            },
            {
              sectionName: "Styles",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                // const baseProperty = getBasePropertyPath(propertyPath);
                // console.log("Table log:", { baseProperty }, { propertyPath });
                const columnType = get(props, `${propertyPath}.columnType`, "");

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
                  updateHook: updateDerivedColumnsHook,
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
                  propertyName: "buttonLabel",
                  label: "Label",
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Action",
                  updateHook: updateDerivedColumnsHook,
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
        validation: VALIDATION_TYPES.TEXT,
      },
      {
        propertyName: "totalRecordsCount",
        label: "Total Record Count",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter total record count",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: VALIDATION_TYPES.NUMBER,
      },
      {
        propertyName: "defaultPageSize",
        label: "Default Page Size",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter default page size",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: VALIDATION_TYPES.NUMBER,
      },
      {
        helpText: "Selects the default selected row",
        propertyName: "defaultSelectedRow",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter row index",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: VALIDATION_TYPES.DEFAULT_SELECTED_ROW,
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
        validation: VALIDATION_TYPES.BOOLEAN,
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
        helpText: "Toggle visibility of the compact mode",
        propertyName: "isVisibleCompactMode",
        label: "Compact Mode",
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
