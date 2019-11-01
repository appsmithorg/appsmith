import { WidgetCardProps } from "../widgets/BaseWidget";
import { generateReactKey } from "../utils/generators";
/* eslint-disable no-useless-computed-key */

const WidgetSidebarResponse: {
  [id: string]: WidgetCardProps[];
} = {
  ["Common Widgets"]: [
    {
      type: "TEXT_WIDGET",
      icon: "icon-text",
      widgetCardName: "Text",
      key: generateReactKey(),
    },
    {
      type: "INPUT_WIDGET",
      icon: "icon-input",
      widgetCardName: "Input",
      key: generateReactKey(),
    },
    {
      type: "TABLE_WIDGET",
      icon: "icon-table",
      widgetCardName: "Table",
      key: generateReactKey(),
    },
    {
      type: "BUTTON_WIDGET",
      icon: "icon-button",
      widgetCardName: "Button",
      key: generateReactKey(),
    },
    {
      type: "CONTAINER_WIDGET",
      icon: "icon-container",
      widgetCardName: "Container",
      key: generateReactKey(),
    },
  ],
  ["Form Widgets"]: [
    {
      type: "DROP_DOWN_WIDGET",
      icon: "icon-dropdown",
      widgetCardName: "Dropdown",
      key: generateReactKey(),
    },
    {
      type: "CHECKBOX_WIDGET",
      icon: "icon-checkbox",
      widgetCardName: "Checkbox",
      key: generateReactKey(),
    },
    {
      type: "RADIO_GROUP_WIDGET",
      icon: "icon-radio",
      widgetCardName: "Radio Button",
      key: generateReactKey(),
    },
    {
      type: "SWITCH_WIDGET",
      icon: "icon-switch",
      widgetCardName: "Switch",
      key: generateReactKey(),
    },
    {
      type: "DATE_PICKER_WIDGET",
      icon: "icon-datepicker",
      widgetCardName: "DatePicker",
      key: generateReactKey(),
    },
    {
      type: "FILE_PICKER_WIDGET",
      icon: "icon-filepicker",
      widgetCardName: "FilePicker",
      key: generateReactKey(),
    },
    {
      type: "BUTTON_WIDGET",
      icon: "icon-button",
      widgetCardName: "Button",
      key: generateReactKey(),
    },
  ],
  ["View widgets"]: [
    {
      type: "IMAGE_WIDGET",
      icon: "icon-image",
      widgetCardName: "Image",
      key: generateReactKey(),
    },
    {
      type: "TEXT_WIDGET",
      icon: "icon-text",
      widgetCardName: "Text",
      key: generateReactKey(),
    },
    {
      type: "SPINNER_WIDGET",
      icon: "icon-spinner",
      widgetCardName: "Spinner",
      key: generateReactKey(),
    },
    {
      type: "TABLE_WIDGET",
      icon: "icon-table",
      widgetCardName: "Table",
      key: generateReactKey(),
    },
  ],
  ["Layout widgets"]: [
    {
      type: "CONTAINER_WIDGET",
      icon: "icon-container",
      widgetCardName: "Container",
      key: generateReactKey(),
    },
  ],
};

export default WidgetSidebarResponse;
