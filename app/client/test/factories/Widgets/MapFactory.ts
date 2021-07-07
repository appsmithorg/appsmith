import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const MapFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  isDisabled: false,
  enableSearch: true,
  zoomLevel: 50,
  enablePickLocation: true,
  allowZoom: true,
  mapCenter: {
    lat: 20.593684,
    long: 78.96288,
  },
  defaultMarkers:
    '[\n  {\n    "lat: -34.397,\n    "long: 150.644,\n    "title: "Test A"\n  }\n]',
  type: "MAP_WIDGET",
  isLoading: false,
  parentColumnSpace: 71.75,
  parentRowSpace: 38,
  leftColumn: 3,
  rightColumn: 11,
  topRow: 0,
  bottomRow: 12,
  parentId: "yt4ouwn0sk",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Map${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
