import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { migrateTextStyleFromTextWidget } from "utils/migrations/TextWidgetReplaceTextStyle";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";

const inputDsl: ContainerWidgetProps<WidgetProps> = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1118,
  snapColumns: 16,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1280,
  containerStyle: "none",
  snapRows: 33,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 15,
  minHeight: 1292,
  parentColumnSpace: 1,
  dynamicTriggerPathList: [],
  dynamicBindingPathList: [],
  leftColumn: 0,
  isLoading: false,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      isVisible: true,
      text: "Label",
      textStyle: "LABEL",
      textAlign: "LEFT",
      widgetName: "Text1",
      version: 1,
      type: "TEXT_WIDGET",
      isLoading: false,
      parentColumnSpace: 67.375,
      parentRowSpace: 40,
      leftColumn: 3,
      rightColumn: 7,
      topRow: 1,
      bottomRow: 2,
      parentId: "0",
      widgetId: "yf8bhokz7d",
      dynamicBindingPathList: [],
      renderMode: "CANVAS",
    },
  ],
};

const outputDsl: ContainerWidgetProps<WidgetProps> = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1118,
  snapColumns: 16,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1280,
  containerStyle: "none",
  snapRows: 33,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 15,
  minHeight: 1292,
  parentColumnSpace: 1,
  dynamicTriggerPathList: [],
  dynamicBindingPathList: [],
  leftColumn: 0,
  isLoading: false,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      isVisible: true,
      text: "Label",
      textAlign: "LEFT",
      widgetName: "Text1",
      version: 1,
      type: "TEXT_WIDGET",
      isLoading: false,
      parentColumnSpace: 67.375,
      parentRowSpace: 40,
      leftColumn: 3,
      rightColumn: 7,
      topRow: 1,
      bottomRow: 2,
      parentId: "0",
      widgetId: "yf8bhokz7d",
      dynamicBindingPathList: [],
      fontSize: TextSizes.PARAGRAPH,
      fontStyle: FontStyleTypes.BOLD,
      renderMode: "CANVAS",
    },
  ],
};

describe("Text Widget Property Pane Upgrade", () => {
  it("To test text widget textStyle property is migrated", () => {
    const newDsl = migrateTextStyleFromTextWidget(inputDsl);
    expect(JSON.stringify(newDsl) === JSON.stringify(outputDsl));
  });
});
