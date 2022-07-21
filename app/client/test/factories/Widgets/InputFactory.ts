import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const InputFactory = Factory.Sync.makeFactory<WidgetProps>({
  widgetName: Factory.each((i) => `Input${i + 1}`),
  onTextChanged: "",
  rightColumn: 11,
  widgetId: generateReactKey(),
  topRow: 6,
  bottomRow: 7,
  isValid: "",
  parentRowSpace: 38,
  isVisible: true,
  label: "Test Input Label",
  type: "INPUT_WIDGET_V2",
  dynamicBindingPathList: [],
  parentId: "iw4o07jvik",
  isLoading: false,
  parentColumnSpace: 34.6875,
  leftColumn: 6,
  dynamicTriggerPathList: [
    {
      key: "onTextChange",
    },
  ],
  inputType: "",
  placeholderText: "",
  defaultText: "",
});
