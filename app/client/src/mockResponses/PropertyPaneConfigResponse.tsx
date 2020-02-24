import { PropertyPaneConfigState } from "reducers/entityReducers/propertyPaneConfigReducer";

const PropertyPaneConfigResponse = {
  config: {
    BUTTON_WIDGET: [
      {
        sectionName: "General",
        id: "1",
        children: [
          {
            id: "1.1",
            propertyName: "text",
            label: "Button Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter button text",
          },
          {
            id: "1.2",
            propertyName: "buttonStyle",
            label: "Button Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Primary Button",
                value: "PRIMARY_BUTTON",
              },
              {
                label: "Secondary Button",
                value: "SECONDARY_BUTTON",
              },
              {
                label: "Danger Button",
                value: "DANGER_BUTTON",
              },
            ],
          },
          {
            id: "1.3",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
          },
          {
            id: "1.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "2",
        children: [
          {
            id: "2.1",
            propertyName: "onClick",
            label: "onClick",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    TEXT_WIDGET: [
      {
        sectionName: "General",
        id: "3",
        children: [
          {
            id: "3.1",
            propertyName: "text",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter your text",
          },
          {
            id: "3.2",
            propertyName: "textStyle",
            label: "Text Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Heading",
                value: "HEADING",
              },
              {
                label: "Label",
                value: "LABEL",
              },
              {
                label: "Body",
                value: "BODY",
              },
            ],
          },
          {
            id: "3.3",
            propertyName: "shouldScroll",
            label: "Enable Scroll",
            controlType: "SWITCH",
          },
          {
            id: "3.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
    ],
    IMAGE_WIDGET: [
      {
        sectionName: "General",
        id: "4",
        children: [
          {
            id: "4.1",
            propertyName: "image",
            label: "Image",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL",
          },
          {
            id: "4.1",
            propertyName: "defaultImage",
            label: "Default Image",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL",
          },
          {
            id: "4.3",
            propertyName: "imageShape",
            label: "Shape",
            controlType: "SHAPE_PICKER",
          },
          {
            id: "4.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
    ],
    INPUT_WIDGET: [
      {
        sectionName: "General",
        id: "5",
        children: [
          {
            id: "5.1",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Label the widget",
            inputType: "TEXT",
          },
          {
            id: "5.2",
            propertyName: "inputType",
            label: "Data Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Text",
                value: "TEXT",
              },
              {
                label: "Number",
                value: "NUMBER",
              },
              {
                label: "Password",
                value: "PASSWORD",
              },
              {
                label: "Phone Number",
                value: "PHONE_NUMBER",
              },
              {
                label: "Email",
                value: "EMAIL",
              },
            ],
          },
          {
            id: "5.3",
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter your text",
          },
          {
            id: "5.4",
            propertyName: "defaultText",
            label: "Default Input",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the default text",
          },
          {
            id: "5.5",
            propertyName: "maxChars",
            label: "Max Chars",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the max length",
            inputType: "INTEGER",
          },
          {
            id: "5.6",
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the regex",
            inputType: "TEXT",
          },
          {
            id: "5.7",
            propertyName: "errorMessage",
            label: "Error Message",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the message",
            inputType: "TEXT",
          },
          {
            id: "5.8",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
          {
            id: "5.9",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "5.1.1",
        children: [
          {
            id: "5.1.2",
            propertyName: "onTextChanged",
            label: "onTextChanged",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    SWITCH_WIDGET: [
      {
        sectionName: "General",
        id: "6",
        children: [
          {
            id: "6.1",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Label the widget",
            inputType: "TEXT",
          },
          {
            id: "6.2",
            propertyName: "isOn",
            label: "Default State",
            controlType: "SWITCH",
          },
          {
            id: "6.3",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
          {
            id: "6.4",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "6.1.1",
        children: [
          {
            id: "6.1.2",
            propertyName: "onToggle",
            label: "onToggle",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    CONTAINER_WIDGET: [
      {
        sectionName: "General",
        id: "7",
        children: [
          {
            id: "7.1",
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
          },
          {
            id: "7.2",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
    ],
    SPINNER_WIDGET: [
      {
        sectionName: "General",
        id: "8",
        children: [
          {
            id: "8.1",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
    ],
    DATE_PICKER_WIDGET: [
      {
        sectionName: "General",
        id: "9",
        children: [
          {
            id: "9.2",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter Label",
          },
          {
            id: "9.3",
            propertyName: "defaultDate",
            label: "Default Date",
            controlType: "DATE_PICKER",
            placeholderText: "Enter Default Date",
          },
          {
            id: "9.5",
            propertyName: "timezone",
            label: "Timezone",
            controlType: "TIMEZONE_PICKER",
            placeholderText: "Select Timezone",
          },
          {
            id: "9.6",
            propertyName: "enableTimePicker",
            label: "Enable Time",
            controlType: "SWITCH",
          },
          {
            id: "9.7",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
          {
            id: "9.8",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "10",
        children: [
          {
            id: "10.1",
            propertyName: "onDateSelected",
            label: "onDateSelected",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    TABLE_WIDGET: [
      {
        sectionName: "General",
        id: "11",
        children: [
          {
            id: "11.1",
            propertyName: "label",
            label: "Enter Table Label",
            controlType: "INPUT_TEXT",
          },
          {
            id: "11.2",
            propertyName: "tableData",
            label: "Table Data",
            controlType: "INPUT_TEXT",
            inputType: "ARRAY",
          },
          {
            id: "11.5",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "12",
        children: [
          {
            id: "12.1",
            propertyName: "columnActions",
            label: "Table Actions",
            controlType: "COLUMN_ACTION_SELECTOR",
          },
          {
            id: "12.2",
            propertyName: "onRowSelected",
            label: "onRowSelected",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
      {
        sectionName: "Pagination",
        id: "19",
        children: [
          {
            id: "19.1",
            propertyName: "serverSidePaginationEnabled",
            label: "Server Side Pagination",
            controlType: "SWITCH",
          },
          {
            id: "19.2",
            propertyName: "onPageChange",
            label: "onPageChange",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    DROP_DOWN_WIDGET: [
      {
        sectionName: "General",
        id: "13",
        children: [
          {
            id: "13.1",
            propertyName: "selectionType",
            label: "Selection Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Single Select",
                value: "SINGLE_SELECT",
              },
              {
                label: "Multi Select",
                value: "MULTI_SELECT",
              },
            ],
          },
          {
            id: "13.4",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter [{label, value}]",
          },
          {
            id: "13.2",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the label",
          },
          {
            id: "13.5",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "14",
        children: [
          {
            id: "14.1",
            propertyName: "onOptionChange",
            label: "onOptionChange",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    CHECKBOX_WIDGET: [
      {
        sectionName: "General",
        id: "15",
        children: [
          {
            id: "15.1",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the label",
          },
          {
            id: "15.2",
            propertyName: "defaultCheckedState",
            label: "Default State",
            controlType: "SWITCH",
          },
          {
            id: "15.3",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
          },
          {
            id: "15.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "16",
        children: [
          {
            id: "16.1",
            propertyName: "onCheckChange",
            label: "onCheckChange",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    RADIO_GROUP_WIDGET: [
      {
        sectionName: "General",
        id: "16",
        children: [
          {
            id: "16.1",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the label",
          },
          {
            id: "16.2",
            propertyName: "defaultOptionValue",
            label: "Default Selected Value",
            controlType: "INPUT_TEXT",
          },
          {
            id: "16.3",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
          },
          {
            id: "16.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "17",
        children: [
          {
            id: "17.1",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
          },
        ],
      },
    ],
    FILE_PICKER_WIDGET: [
      {
        sectionName: "General",
        id: "18",
        children: [
          {
            id: "18.1",
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter Label",
            inputType: "INTEGER",
          },
          {
            id: "18.2",
            propertyName: "maxNumFiles",
            label: "No. of files",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter No. of files",
          },
          {
            id: "18.3",
            propertyName: "allowedFileTypes",
            label: "Allowed File Types",
            controlType: "MULTI_SELECT",
            placeholderText: "Enter No. of files",
            options: [
              {
                label: "Any File",
                value: "*",
              },
              {
                label: "Images",
                value: "image/*",
              },
              {
                label: "Videos",
                value: "video/*",
              },
              {
                label: "Audio",
                value: "audio/*",
              },
              {
                label: "Text",
                value: "text/*",
              },
              {
                label: "JPEG",
                value: "image/jpeg",
              },
              {
                label: "PNG",
                value: "*.png",
              },
              {
                label: "GIF",
                value: "*.gif",
              },
            ],
          },
          {
            id: "18.4",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
          },
        ],
      },
    ],
  },
  name: "propertyPane",
};

export default PropertyPaneConfigResponse;
