import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ListFactory = Factory.Sync.makeFactory<WidgetProps>({
  image: "",
  defaultImage: "",
  type: "LIST_WIDGET",
  template: {},
  parentId: "Container1",
  parentColumnSpace: 2,
  parentRowSpace: 3,
  leftColumn: 2,
  rightColumn: 3,
  topRow: 1,
  bottomRow: 10,
  isLoading: false,
  listData: [],
  disablePropertyPane: false,
  widgetName: Factory.each((i) => `List${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
