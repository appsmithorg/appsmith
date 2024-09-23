import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import type { WidgetProps } from "widgets/BaseWidget";

const widgetName = Factory.each((i) => `List${i + 1}`);

export const ListV2Factory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  type: "LIST_WIDGET_V2",
  backgroundColor: "transparent",
  itemBackgroundColor: "#FFFFFF",
  requiresFlatWidgetChildren: true,
  hasMetaWidgets: true,
  animateLoading: true,
  gridType: "vertical",
  minWidth: 450,
  responsiveBehavior: "fill",
  flexVerticalAlignment: "start",
  dynamicBindingPathList: [
    {
      key: "currentItemsView",
    },
    {
      key: "selectedItemView",
    },
    {
      key: "triggeredItemView",
    },
    {
      key: "primaryKeys",
    },
    {
      key: "accentColor",
    },
    {
      key: "borderRadius",
    },
    {
      key: "boxShadow",
    },
  ],
  currentItemsView: "{{[]}}",
  selectedItemView: "{{{}}}",
  triggeredItemView: "{{{}}}",
  enhancements: true,
  itemSpacing: 8,
  templateHeight: 160,
  listData: [
    {
      id: "001",
      name: "Blue",
      img: "https://assets.appsmith.com/widgets/default.png",
    },
    {
      id: "002",
      name: "Green",
      img: "https://assets.appsmith.com/widgets/default.png",
    },
    {
      id: "003",
      name: "Red",
      img: "https://assets.appsmith.com/widgets/default.png",
    },
  ],
  pageSize: 3,
  widgetName,
  children: ["j3w480emeh"],
  additionalStaticProps: [
    "level",
    "levelData",
    "prefixMetaWidgetId",
    "metaWidgetId",
  ],
  primaryKeys: `{{${widgetName}.listData.map((currentItem, currentIndex) => currentItem["id"] )}}`,
  key: "vx9iap9z5u",
  isCanvas: true,
  needsErrorInfo: false,
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  accentColor: "{{appsmith.theme.colors.primaryColor}}",
  borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
  boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
  isLoading: false,
  parentColumnSpace: 29.59375,
  parentRowSpace: 10,
  leftColumn: 5,
  rightColumn: 29,
  topRow: 20,
  bottomRow: 60,
  mobileLeftColumn: 5,
  mobileRightColumn: 29,
  mobileTopRow: 20,
  mobileBottomRow: 60,
  parentId: "0",
  mainContainerId: "e342mwiluo",
  mainCanvasId: "j3w480emeh",
});
