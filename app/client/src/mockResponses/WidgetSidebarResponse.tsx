import { WidgetCardProps } from "../widgets/BaseWidget";
import { generateReactKey } from "../utils/generators";

const WidgetSidebarResponse: {
  [id: string]: WidgetCardProps[];
} = {
  common: [
    {
      type: "TEXT_WIDGET",
      icon: "icon-text",
      widgetCardName: "Text",
      key: generateReactKey(),
    },
    {
      type: "BUTTON_WIDGET",
      icon: "icon-button",
      widgetCardName: "Button",
      key: generateReactKey(),
    },
    {
      type: "SPINNER_WIDGET",
      icon: "icon-switch",
      widgetCardName: "Spinner",
      key: generateReactKey(),
    },
    {
      type: "CONTAINER_WIDGET",
      icon: "icon-container",
      widgetCardName: "Container",
      key: generateReactKey(),
    },
  ],
  form: [
    {
      type: "BUTTON_WIDGET",
      icon: "icon-button",
      widgetCardName: "Button",
      key: generateReactKey(),
    },
    {
      type: "BUTTON_WIDGET",
      icon: "icon-button",
      widgetCardName: "Button",
      key: generateReactKey(),
    },
    {
      type: "DROP_DOWN_WIDGET",
      icon: "icon-dropdown",
      widgetCardName: "Dropdown",
      key: generateReactKey(),
    },
    {
      type: "DATE_PICKER_WIDGET",
      icon: "icon-datepicker",
      widgetCardName: "DatePicker",
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
      widgetCardName: "Toggle",
      key: generateReactKey(),
    },
  ],
  view: [
    {
      type: "TEXT_WIDGET",
      icon: "icon-text",
      widgetCardName: "Text",
      key: generateReactKey(),
    },
    {
      type: "CONTAINER_WIDGET",
      icon: "icon-container",
      widgetCardName: "Container",
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
};

export default WidgetSidebarResponse;
