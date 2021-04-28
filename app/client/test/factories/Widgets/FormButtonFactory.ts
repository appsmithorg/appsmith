import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const FormButtonFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  text: "Reset",
  isDefaultClickDisabled: true,
  buttonStyle: "SECONDARY_BUTTON",
  disabledWhenInvalid: false,
  resetFormOnClick: true,
  type: "FORM_BUTTON_WIDGET",
  isLoading: false,
  leftColumn: 8,
  rightColumn: 12,
  topRow: 12,
  bottomRow: 13,
  parentId: "qrqizehc5b",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `FormButton${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
