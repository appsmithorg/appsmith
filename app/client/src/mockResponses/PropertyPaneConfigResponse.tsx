import { PropertyPaneConfigState } from "../reducers/entityReducers/propertyPaneConfigReducer";

const PropertyPaneConfigResponse: PropertyPaneConfigState = {
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
              { label: "Primary Button", value: "PRIMARY_BUTTON" },
              { label: "Secondary Button", value: "SECONDARY_BUTTON" },
              { label: "Danger Button", value: "DANGER_BUTTON" },
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
            label: "Visibile",
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
              { label: "Heading", value: "HEADING" },
              { label: "Label", value: "LABEL" },
              { label: "Body", value: "BODY" },
            ],
          },
          {
            id: "3.3",
            propertyName: "isVisible",
            label: "Visibile",
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
            label: "Image Url",
            placeholderText: "Enter URL",
            controlType: "INPUT_TEXT",
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
            label: "Visibile",
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
            inputType: "TEXT",
            placeholderText: "Label the widget",
          },
          {
            id: "5.2",
            propertyName: "inputType",
            label: "Data Type",
            controlType: "DROP_DOWN",
            options: [
              { label: "Text", value: "TEXT" },
              { label: "Number", value: "NUMBER" },
              { label: "Password", value: "PASSWORD" },
              { label: "Phone Number", value: "PHONE_NUMBER" },
              { label: "Email", value: "EMAIL" },
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
            propertyName: "maxChars",
            label: "Max Chars",
            controlType: "INPUT_TEXT",
            inputType: "INTEGER",
            placeholderText: "Enter the max length",
          },
          {
            id: "5.5",
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            inputType: "TEXT",
            placeholderText: "Enter the regex",
          },
          {
            id: "5.6",
            propertyName: "errorMessage",
            label: "Error Message",
            controlType: "INPUT_TEXT",
            inputType: "TEXT",
            placeholderText: "Enter the message",
          },
          {
            id: "5.8",
            propertyName: "isVisible",
            label: "Visibile",
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
            inputType: "TEXT",
            placeholderText: "Label the widget",
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
            label: "Visibile",
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
            id: "6.3",
            propertyName: "isVisible",
            label: "Visibile",
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
            label: "Visibile",
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
            id: "9.1",
            propertyName: "datePickerType",
            label: "Picker Type",
            controlType: "DROP_DOWN",
            options: [
              { label: "Single Date", value: "DATE_PICKER" },
              { label: "Date Range", value: "DATE_RANGE_PICKER" },
            ],
          },
          {
            id: "9.4",
            propertyName: "label",
            label: "Enter Date Label",
            controlType: "INPUT_TEXT",
          },
          {
            id: "9.1",
            propertyName: "defaultDate",
            label: "Default Date",
            controlType: "DATE_PICKER",
          },
          {
            id: "9.2",
            propertyName: "defaultTimezone",
            label: "Default Timezone",
            controlType: "TIMEZONE_PICKER",
          },
          {
            id: "9.3",
            propertyName: "enableTime",
            label: "Enable Pick Time",
            controlType: "SWITCH",
          },
          {
            id: "9.5",
            propertyName: "isVisible",
            label: "Visibile",
            controlType: "SWITCH",
          },
          {
            id: "9.6",
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
          {
            id: "10.2",
            propertyName: "onDateRangeSelected",
            label: "onDateRangeSelected",
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
          // {
          //   id: "11.2",
          //   propertyName: "tableData",
          //   label: "Enter data array",
          //   controlType: "INPUT_TEXT",
          // },
          {
            id: "11.3",
            propertyName: "nextPageKey",
            label: "Next Pagination Key",
            controlType: "INPUT_TEXT",
          },
          {
            id: "11.4",
            propertyName: "prevPageKey",
            label: "Previous Pagination Key",
            controlType: "INPUT_TEXT",
          },
          {
            id: "11.5",
            propertyName: "isVisible",
            label: "Visibile",
            controlType: "SWITCH",
          },
          {
            id: "11.6",
            propertyName: "tableData",
            label: "Enter data array",
            controlType: "CODE_EDITOR",
          },
        ],
      },
      {
        sectionName: "Actions",
        id: "12",
        children: [
          {
            id: "12.1",
            propertyName: "tableActions",
            label: "Record action",
            controlType: "RECORD_ACTION_SELECTOR",
          },
          {
            id: "12.2",
            propertyName: "onRowSelected",
            label: "onRowSelected",
            controlType: "ACTION_SELECTOR",
          },
          {
            id: "12.3",
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
              { label: "Single Select", value: "SINGLE_SELECT" },
              { label: "Multi Select", value: "MULTI_SELECT" },
            ],
          },
          {
            id: "13.4",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
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
            label: "Visibile",
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
            propertyName: "onOptionSelected",
            label: "onOptionSelected",
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
            label: "Visibile",
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
            controlType: "SWITCH",
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
            label: "Visibile",
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
            propertyName: "onOptionSelected",
            label: "onOptionSelected",
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
            inputType: "INTEGER",
            placeholderText: "Enter Label",
            controlType: "INPUT_TEXT",
          },
          {
            id: "18.2",
            propertyName: "maxNumFiles",
            label: "No. of files",
            placeholderText: "Enter No. of files",
            controlType: "INPUT_TEXT",
          },
          {
            id: "18.3",
            propertyName: "allowedFileTypes",
            label: "Allowed File Types",
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
            controlType: "MULTI_SELECT",
          },
          {
            id: "18.4",
            propertyName: "isVisible",
            label: "Visibile",
            controlType: "SWITCH",
          },
        ],
      },
    ],
  },
  configVersion: 1,
};

export default PropertyPaneConfigResponse;
