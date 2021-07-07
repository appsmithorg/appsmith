import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const SkeletonFactory = Factory.Sync.makeFactory<WidgetProps>({
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Skeleton${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
