import { PropertyPaneConfigState } from "../reducers/entityReducers/propertyPaneConfigReducer";

const PropertyPaneConfigResponse: PropertyPaneConfigState = {
  config: {
    BUTTON_WIDGET: [
      {
        sectionName: "General",
        id: "1",
        children: [
          {
            id: "1",
            propertyName: "text",
            label: "Button Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter button text here",
          },
          {
            id: "2",
            propertyName: "buttonStyle",
            label: "Button Style",
            controlType: "DROP_DOWN",
            options: [
              { label: "Primary Button", value: "PRIMARY_BUTTON" },
              { label: "Secondary Button", value: "SECONDARY_BUTTON" },
            ],
          },
        ],
      },
      {
        sectionName: "Action",
        id: "2",
        children: [
          {
            id: "3",
            propertyName: "text",
            label: "Button Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter button text here",
          },
        ],
      },
    ],
    TEXT_WIDGET: [
      {
        sectionName: "General",
        id: "3",
        children: [],
      },
    ],
    IMAGE_WIDGET: [
      {
        sectionName: "General",
        id: "4",
        children: [],
      },
    ],
    INPUT_WIDGET: [
      {
        sectionName: "General",
        id: "5",
        children: [],
      },
    ],
    SWITCH_WIDGET: [
      {
        sectionName: "General",
        id: "6",
        children: [],
      },
    ],
    CONTAINER_WIDGET: [
      {
        sectionName: "General",
        id: "7",
        children: [],
      },
    ],
    SPINNER_WIDGET: [
      {
        sectionName: "General",
        id: "8",
        children: [],
      },
    ],
    DATE_PICKER_WIDGET: [
      {
        sectionName: "General",
        id: "9",
        children: [],
      },
    ],
    TABLE_WIDGET: [
      {
        sectionName: "General",
        id: "9",
        children: [],
      },
    ],
    DROP_DOWN_WIDGET: [
      {
        sectionName: "General",
        id: "10",
        children: [],
      },
    ],
    CHECKBOX_WIDGET: [
      {
        sectionName: "General",
        id: "11",
        children: [],
      },
    ],
    RADIO_GROUP_WIDGET: [
      {
        sectionName: "General",
        id: "12",
        children: [],
      },
    ],
    ALERT_WIDGET: [
      {
        sectionName: "General",
        id: "13",
        children: [],
      },
    ],
  },
  configVersion: 1,
};

export default PropertyPaneConfigResponse;
