import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const CheckboxFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  label: "Label",
  defaultCheckedState: true,
  type: "CHECKBOX_WIDGET",
  isLoading: false,
  parentColumnSpace: 71.75,
  parentRowSpace: 38,
  leftColumn: 10,
  rightColumn: 13,
  topRow: 4,
  bottomRow: 5,
  parentId: "e3tq9qwta6",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Checkbox${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
