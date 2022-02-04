import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const DropdownFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  label: "",
  selectionType: "SINGLE_SELECT",
  options: [
    { label: "Vegetarian", value: "VEG" },
    { label: "Non-Vegetarian", value: "NON_VEG" },
    { label: "Vegan", value: "VEGAN" },
  ],
  defaultOptionValue: { label: "Vegan", value: "VEGAN" },
  type: "SELECT_WIDGET",
  isLoading: false,
  parentColumnSpace: 74,
  parentRowSpace: 40,
  leftColumn: 10,
  rightColumn: 15,
  topRow: 1,
  bottomRow: 2,
  parentId: "0",
  widgetId: generateReactKey(),
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Dropdown${i + 1}`),
  renderMode: "CANVAS",
  version: 1,
});
