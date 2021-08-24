import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const CanvasFactory = Factory.Sync.makeFactory<WidgetProps>({
  backgroundColor: "none",
  rightColumn: 1224,
  snapColumns: 16,
  detachFromLayout: true,
  topRow: 0,
  bottomRow: 1280,
  containerStyle: "none",
  snapRows: 33,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  isVisible: true,
  canExtend: true,
  minHeight: 1292,
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  widgetName: Factory.each((i) => `Canvas${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
