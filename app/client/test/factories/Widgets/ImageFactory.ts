import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ImageFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  defaultImage: "https://assets.appsmith.com/widgets/default.png",
  enableDownload: false,
  enableRotation: false,
  imageShape: "RECTANGLE",
  image: "",
  widgetName: Factory.each((i) => `Image${i + 1}`),
  type: "IMAGE_WIDGET",
  isLoading: false,
  parentColumnSpace: 34.6875,
  parentRowSpace: 38,
  leftColumn: 6,
  rightColumn: 10,
  topRow: 2,
  bottomRow: 5,
  parentId: "bxekwxgc1i",
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
