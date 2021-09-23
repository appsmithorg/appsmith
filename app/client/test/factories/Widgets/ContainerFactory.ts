import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ContainerFactory = Factory.Sync.makeFactory<WidgetProps>({
  backgroundColor: "#FFFFFF",
  widgetName: Factory.each((i) => `Container${i + 1}`),
  type: "CONTAINER_WIDGET",
  containerStyle: "card",
  isVisible: true,
  isLoading: false,
  parentColumnSpace: 75.25,
  parentRowSpace: 38,
  dynamicBindingPathList: [],
  leftColumn: 0,
  rightColumn: 8,
  topRow: 0,
  bottomRow: 9,
  snapColumns: 16,
  orientation: "VERTICAL",
  children: [],
  version: 1,
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
});
