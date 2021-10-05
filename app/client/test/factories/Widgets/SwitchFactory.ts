import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const SwitchFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  label: "Switch",
  defaultSwitchState: true,
  widgetName: Factory.each((i) => `Switch${i + 1}`),
  type: "SWITCH_WIDGET",
  isLoading: false,
  parentColumnSpace: 71.75,
  parentRowSpace: 38,
  leftColumn: 10,
  rightColumn: 13,
  topRow: 18,
  bottomRow: 19,
  parentId: "e3tq9qwta6",
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
