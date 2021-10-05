import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const RadiogroupFactory = Factory.Sync.makeFactory<WidgetProps>({
  rightColumn: 16,
  topRow: 3,
  bottomRow: 5,
  parentRowSpace: 38,
  isVisible: true,
  label: "Test Radio",
  type: "RADIO_GROUP_WIDGET",
  isLoading: false,
  defaultOptionValue: "1",
  parentColumnSpace: 34.6875,
  leftColumn: 12,
  dynamicTriggerPathList: [
    {
      key: "onSelectionChange",
    },
  ],
  onSelectionChange: "{{navigateTo()}}",
  options: [
    {
      id: "1",
      label: "jarvis",
      value: "1",
    },
    {
      id: "2",
      label: "marvel",
      value: "2",
    },
    {
      label: "iron",
      value: "4",
    },
  ],
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `RadioGroup${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
