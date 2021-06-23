import { WidgetCardProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import { keyBy } from "lodash";
/* eslint-disable no-useless-computed-key */

const WidgetSidebarResponse: WidgetCardProps[] = [
  {
    type: "BUTTON_WIDGET",
    widgetCardName: "Button",
    key: generateReactKey(),
  },
  {
    type: "CHART_WIDGET",
    widgetCardName: "Chart",
    key: generateReactKey(),
  },
  {
    type: "CHECKBOX_WIDGET",
    widgetCardName: "Checkbox",
    key: generateReactKey(),
  },
  {
    type: "SWITCH_WIDGET",
    widgetCardName: "Switch",
    key: generateReactKey(),
  },
  {
    type: "CONTAINER_WIDGET",
    widgetCardName: "Container",
    key: generateReactKey(),
  },
  {
    type: "DATE_PICKER_WIDGET2",
    widgetCardName: "DatePicker",
    key: generateReactKey(),
  },
  {
    type: "DROP_DOWN_WIDGET",
    widgetCardName: "Select",
    key: generateReactKey(),
  },
  {
    type: "FILE_PICKER_WIDGET",
    widgetCardName: "FilePicker",
    key: generateReactKey(),
  },
  {
    type: "FORM_WIDGET",
    widgetCardName: "Form",
    key: generateReactKey(),
  },
  {
    type: "LIST_WIDGET",
    widgetCardName: "List",
    key: generateReactKey(),
    isBeta: true,
  },
  {
    type: "IMAGE_WIDGET",
    widgetCardName: "Image",
    key: generateReactKey(),
  },
  {
    type: "INPUT_WIDGET",
    widgetCardName: "Input",
    key: generateReactKey(),
  },
  {
    type: "MAP_WIDGET",
    widgetCardName: "Map",
    key: generateReactKey(),
  },
  {
    type: "RADIO_GROUP_WIDGET",
    widgetCardName: "Radio",
    key: generateReactKey(),
  },
  {
    type: "RICH_TEXT_EDITOR_WIDGET",
    widgetCardName: "Rich Text Editor",
    key: generateReactKey(),
  },
  {
    type: "TABLE_WIDGET",
    widgetCardName: "Table",
    key: generateReactKey(),
  },
  {
    type: "TABS_WIDGET",
    widgetCardName: "Tabs",
    key: generateReactKey(),
  },
  {
    type: "TEXT_WIDGET",
    widgetCardName: "Text",
    key: generateReactKey(),
  },
  {
    type: "VIDEO_WIDGET",
    widgetCardName: "Video",
    key: generateReactKey(),
  },
  {
    type: "MODAL_WIDGET",
    widgetCardName: "Modal",
    key: generateReactKey(),
  },
  {
    type: "IFRAME_WIDGET",
    widgetCardName: "Iframe",
    key: generateReactKey(),
  },
];

export default WidgetSidebarResponse;

export const widgetSidebarConfig = keyBy(WidgetSidebarResponse, "type");
