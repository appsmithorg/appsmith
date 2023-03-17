import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const RichTextFactory = Factory.Sync.makeFactory<WidgetProps>({
  rightColumn: 11,
  topRow: 3,
  bottomRow: 8,
  parentRowSpace: 38,
  isVisible: true,
  type: "RICH_TEXT_EDITOR_WIDGET",
  isLoading: false,
  parentColumnSpace: 34.6875,
  leftColumn: 3,
  dynamicTriggerPathList: [
    {
      key: "onTextChange",
    },
  ],
  defaultText: "",
  text: "This is the initial <b>content</b> of the editor",
  isDisabled: false,
  onTextChange: "{{navigateTo()}}",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `RichText${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
