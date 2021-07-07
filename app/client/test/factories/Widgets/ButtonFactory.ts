import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ButtonFactory = Factory.Sync.makeFactory<WidgetProps>({
  widgetName: Factory.each((i) => `Button${i + 1}`),
  rightColumn: 12,
  onClick: "",
  isDefaultClickDisabled: true,
  widgetId: generateReactKey(),
  buttonStyle: "PRIMARY_BUTTON",
  topRow: 1,
  bottomRow: 2,
  parentRowSpace: 38,
  isVisible: true,
  type: "BUTTON_WIDGET",
  dynamicBindingPathList: [],
  parentId: "0",
  isLoading: false,
  parentColumnSpace: 34.6875,
  leftColumn: 10,
  dynamicTriggerPathList: [
    {
      key: "onClick",
    },
  ],
  text: "Test Button Text",
  isDisabled: false,
  version: 1,
  renderMode: "CANVAS",
});
