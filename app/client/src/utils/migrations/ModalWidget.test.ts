import { GridDefaults } from "constants/WidgetConstants";
import { DSLWidget } from "widgets/constants";
import { migrateResizableModalWidgetProperties } from "./ModalWidget";

const inputDsl1: DSLWidget = {
  widgetName: "MainContainer",
  widgetId: "0",
  type: "CANVAS_WIDGET",
  version: 15,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      widgetName: "modal",
      version: 1,
      type: "MODAL_WIDGET",
      size: "MODAL_SMALL",
      parentId: "0",
      widgetId: "yf8bhokz7d",
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

const outputDsl1: DSLWidget = {
  widgetName: "MainContainer",
  widgetId: "0",
  type: "CANVAS_WIDGET",
  version: 15,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      widgetName: "modal",
      version: 2,
      type: "MODAL_WIDGET",
      height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24,
      width: 456,
      parentId: "0",
      widgetId: "yf8bhokz7d",
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

const inputDsl2: DSLWidget = {
  widgetName: "MainContainer",
  widgetId: "0",
  type: "CANVAS_WIDGET",
  version: 15,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      widgetName: "modal",
      version: 1,
      type: "MODAL_WIDGET",
      size: "MODAL_LARGE",
      parentId: "0",
      widgetId: "yf8bhokz7d",
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

const outputDsl2: DSLWidget = {
  widgetName: "MainContainer",
  widgetId: "0",
  type: "CANVAS_WIDGET",
  version: 15,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      widgetName: "modal",
      version: 2,
      type: "MODAL_WIDGET",
      height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 60,
      width: 532,
      parentId: "0",
      widgetId: "yf8bhokz7d",
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

const dsl3: DSLWidget = {
  widgetName: "MainContainer",
  widgetId: "0",
  type: "CANVAS_WIDGET",
  version: 15,
  parentId: "",
  renderMode: "CANVAS",
  children: [
    {
      widgetName: "modal",
      version: 2,
      type: "MODAL_WIDGET",
      height: 500,
      width: 532,
      parentId: "0",
      widgetId: "yf8bhokz7d",
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  ],
  parentColumnSpace: 0,
  parentRowSpace: 0,
  leftColumn: 0,
  rightColumn: 0,
  topRow: 0,
  bottomRow: 0,
  isLoading: false,
};

describe("Migrate to Resizable Modal", () => {
  it("To test modal with type MODAL_SMALL", () => {
    const newDsl = migrateResizableModalWidgetProperties(inputDsl1);
    expect(JSON.stringify(newDsl) === JSON.stringify(outputDsl1));
  });
  it("To test modal with type MODAL_SMALL", () => {
    const newDsl = migrateResizableModalWidgetProperties(inputDsl2);
    expect(JSON.stringify(newDsl) === JSON.stringify(outputDsl2));
  });
  it("To test a migrated modal", () => {
    const newDsl = migrateResizableModalWidgetProperties(dsl3);
    expect(JSON.stringify(newDsl) === JSON.stringify(dsl3));
  });
});
