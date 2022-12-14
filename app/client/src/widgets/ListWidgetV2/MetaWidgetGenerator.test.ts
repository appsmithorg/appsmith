import { difference } from "lodash";
import { klona } from "klona";

import MetaWidgetGenerator, { GeneratorOptions } from "./MetaWidgetGenerator";
import { FlattenedWidgetProps } from "widgets/constants";
import { nestedListInput, simpleListInput } from "./testData";
import { RenderModes } from "constants/WidgetConstants";
import { ButtonFactory } from "test/factories/Widgets/ButtonFactory";
import { LevelData } from "./widget";

type Validator = {
  widgetType: string;
  occurrence: number;
};

const data = [
  { id: 1, name: "Blue" },
  { id: 2, name: "Pink" },
  { id: 3, name: "Black" },
  { id: 4, name: "White" },
];

const DEFAULT_OPTIONS = {
  cacheIndexArr: [-1, -1],
  containerParentId: simpleListInput.containerParentId,
  containerWidgetId: simpleListInput.mainContainerId,
  currTemplateWidgets: simpleListInput.templateWidgets,
  data,
  itemGap: 10,
  infiniteScroll: false,
  levelData: undefined,
  prevTemplateWidgets: {},
  primaryKeys: data.map((d) => d.id),
  scrollElement: null,
  templateBottomRow: 12,
  widgetName: "List1",
  pageNo: 1,
  pageSize: 2,
  serverSidePagination: false,
};

const levelData: LevelData = {
  level_1: {
    currentIndex: 0,
    currentItem: "{{List1.listData[0]}}",
    currentRowCache: {
      Image1: {
        entityDefinition: "image: Image1.image,isVisible: Image1.isVisible",
        rowIndex: 0,
        metaWidgetId: "623fj7t7ld",
        metaWidgetName: "Image1",
        viewIndex: 0,
        templateWidgetId: "623fj7t7ld",
        templateWidgetName: "Image1",
        type: "IMAGE_WIDGET",
      },
      Text1: {
        entityDefinition: "isVisible: Text1.isVisible,text: Text1.text",
        rowIndex: 0,
        metaWidgetId: "9qcijo7ri3",
        metaWidgetName: "Text1",
        viewIndex: 0,
        templateWidgetId: "9qcijo7ri3",
        templateWidgetName: "Text1",
        type: "TEXT_WIDGET",
      },
      Text2: {
        entityDefinition: "isVisible: Text2.isVisible,text: Text2.text",
        rowIndex: 0,
        metaWidgetId: "25x15bnona",
        metaWidgetName: "Text2",
        viewIndex: 0,
        templateWidgetId: "25x15bnona",
        templateWidgetName: "Text2",
        type: "TEXT_WIDGET",
      },
      List6: {
        entityDefinition:
          "backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,gridGap: List6.gridGap,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItemView: List6.triggeredItemView,items: List6.items,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,selectedItemIndex: List6.selectedItemIndex,triggeredItemIndex: List6.triggeredItemIndex",
        rowIndex: 0,
        metaWidgetId: "fs2d2lqjgd",
        metaWidgetName: "List6",
        viewIndex: 0,
        templateWidgetId: "fs2d2lqjgd",
        templateWidgetName: "List6",
        type: "LIST_WIDGET_V2",
      },
      Canvas2: {
        entityDefinition: "",
        rowIndex: 0,
        metaWidgetId: "qpgtpiw3cu",
        metaWidgetName: "Canvas2",
        viewIndex: 0,
        templateWidgetId: "qpgtpiw3cu",
        templateWidgetName: "Canvas2",
        type: "CANVAS_WIDGET",
      },
      Container1: {
        entityDefinition:
          "backgroundColor: Container1.backgroundColor,isVisible: Container1.isVisible",
        rowIndex: 0,
        metaWidgetId: "lneohookgm",
        metaWidgetName: "Container1",
        viewIndex: 0,
        templateWidgetId: "lneohookgm",
        templateWidgetName: "Container1",
        type: "CONTAINER_WIDGET",
      },
    },
    autocomplete: {
      currentItem: {
        id: 1,
        name: "Blue",
      },
      currentView: "{{Container1.data}}",
    },
  },
};

class Cache {
  data = {};

  getWidgetCache = () => {
    return this.data;
  };

  setWidgetCache = (data: any) => {
    this.data = data;
  };
}

const init = (optionsOverride?: Partial<GeneratorOptions>) => {
  const options = klona({
    ...DEFAULT_OPTIONS,
    ...optionsOverride,
  });
  const cache = new Cache();

  const generator = new MetaWidgetGenerator({
    getWidgetCache: cache.getWidgetCache,
    setWidgetCache: cache.setWidgetCache,
    infiniteScroll: false,
    widgetId: "test",
    isListCloned: false,
    level: 1,
    onVirtualListScroll: jest.fn,
    primaryWidgetType: "LIST_WIDGET_V2",
    renderMode: RenderModes.CANVAS,
  });

  const initialResult = generator.withOptions(options).generate();

  options.prevTemplateWidgets = options.currTemplateWidgets;

  return {
    options,
    generator,
    cache,
    initialResult,
  };
};

const validateMetaWidgetType = (
  metaWidgets: Record<string, FlattenedWidgetProps>,
  validators: Validator[],
) => {
  const maxMetaWidgets = Object.keys(metaWidgets).length;
  const maxExpectedWidgets = validators.reduce((acc, validator) => {
    acc += validator.occurrence;
    return acc;
  }, 0);

  expect(maxMetaWidgets).toEqual(maxExpectedWidgets);

  const generatedMetaWidgetTypes = Object.values(metaWidgets).map(
    (w) => w.type,
  );
  const expectedWidgetTypes = validators.reduce((acc: string[], validator) => {
    const { occurrence, widgetType } = validator;
    acc = [...acc, ...Array(occurrence).fill(widgetType)];

    return acc;
  }, []);

  const missingMetaWidget = difference(
    expectedWidgetTypes,
    generatedMetaWidgetTypes,
  );
  const extraGeneratedMetaWidgets = difference(
    generatedMetaWidgetTypes,
    expectedWidgetTypes,
  );

  expect(missingMetaWidget).toEqual([]);
  expect(extraGeneratedMetaWidgets).toEqual([]);
};

describe("#generate", () => {
  it("it generates meta widgets for first instance", () => {
    const cache = new Cache();

    const generator = new MetaWidgetGenerator({
      getWidgetCache: cache.getWidgetCache,
      setWidgetCache: cache.setWidgetCache,
      infiniteScroll: false,
      widgetId: "test",
      isListCloned: false,
      level: 1,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });

    const expectedGeneratedCount = 12;
    const expectedRemovedCount = 0;

    const { metaWidgets, removedMetaWidgetIds } = generator
      .withOptions(DEFAULT_OPTIONS)
      .generate();

    const metaWidgetsCount = Object.keys(metaWidgets).length;

    expect(metaWidgetsCount).toEqual(expectedGeneratedCount);
    expect(removedMetaWidgetIds.length).toEqual(expectedRemovedCount);

    validateMetaWidgetType(metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 4,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 2,
      },
    ]);
  });

  it("it re-generates meta widgets data change", () => {
    const { generator, options } = init();

    const newData = [
      { id: 2, name: "Pink" },
      { id: 3, name: "Black" },
      { id: 4, name: "White" },
    ];
    options.data = newData;
    options.primaryKeys = newData.map((d) => d.id);

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(6);
    expect(result.removedMetaWidgetIds.length).toEqual(6);

    validateMetaWidgetType(result.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 1,
      },
    ]);
  });

  it("it does not re-generates meta widgets options don't change", () => {
    const { generator, options } = init();

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("it re-generates meta widgets when template widgets change", () => {
    const { generator, options } = init();

    const buttonWidget = ButtonFactory.build();
    const containerCanvas = klona(
      simpleListInput.templateWidgets[simpleListInput.mainContainerCanvasId],
    );

    containerCanvas.children?.push(buttonWidget.widgetId);

    // Added new widget
    const nextTemplateWidgets1 = {
      ...options.currTemplateWidgets,
      [containerCanvas.widgetId]: containerCanvas,
      [buttonWidget.widgetId]: buttonWidget,
    };

    options.currTemplateWidgets = nextTemplateWidgets1;

    const result1 = generator.withOptions(options).generate();
    const count1 = Object.keys(result1.metaWidgets).length;

    expect(count1).toEqual(6);
    expect(result1.removedMetaWidgetIds.length).toEqual(0);

    validateMetaWidgetType(result1.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "BUTTON_WIDGET",
        occurrence: 2,
      },
    ]);

    // Removed 2 widgets
    const newContainerCanvas = klona(containerCanvas);
    const buttonWidgetId = buttonWidget.widgetId;
    const imageWidgetId = "epowimtfiu";
    const removedWidgetIds = [buttonWidgetId, imageWidgetId];
    newContainerCanvas.children = newContainerCanvas.children?.filter(
      (c) => !removedWidgetIds.includes(c),
    );

    const nextTemplateWidget2 = {
      ...options.currTemplateWidgets,
      [newContainerCanvas.widgetId]: newContainerCanvas,
    };

    delete nextTemplateWidget2[buttonWidget.widgetId];
    delete nextTemplateWidget2["epowimtfiu"]; // Image widget

    options.currTemplateWidgets = nextTemplateWidget2;

    const result2 = generator.withOptions(options).generate();
    const count2 = Object.keys(result2.metaWidgets).length;

    expect(count2).toEqual(4);
    expect(result2.removedMetaWidgetIds.length).toEqual(4);

    validateMetaWidgetType(result2.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 2,
      },
    ]);
  });

  it("it re-generates meta widgets when template widgets page no changes", () => {
    const { generator, options } = init();

    options.pageNo = 2;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(12);
    expect(result.removedMetaWidgetIds.length).toEqual(12);

    validateMetaWidgetType(result.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 4,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 2,
      },
    ]);
  });

  it("it generates only extra meta widgets when template widgets page size increases", () => {
    const { generator, options } = init();

    options.pageSize = 3;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(6);
    expect(result.removedMetaWidgetIds.length).toEqual(0);

    validateMetaWidgetType(result.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 1,
      },
    ]);
  });

  it("it removes meta widgets when template widgets page size decreases", () => {
    const { generator, options } = init();

    options.pageSize = 3;

    generator.withOptions(options).generate();

    options.pageSize = 1;
    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(12);

    validateMetaWidgetType(result.metaWidgets, []);
  });

  it("it re-generates all meta widgets when primary keys changes in page > 1", () => {
    const { generator, options } = init({ pageNo: 2 });

    options.primaryKeys = options.primaryKeys.map((i) => i + "100");

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(12);
    expect(result.removedMetaWidgetIds.length).toEqual(12);

    validateMetaWidgetType(result.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 4,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 2,
      },
    ]);
  });

  it("it re-generates non template meta widgets when primary keys changes in page = 1", () => {
    const { generator, options } = init();

    options.primaryKeys = options.primaryKeys.map((i) => i + "100");

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(6);
    expect(result.removedMetaWidgetIds.length).toEqual(6);

    validateMetaWidgetType(result.metaWidgets, [
      {
        widgetType: "CANVAS_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "CONTAINER_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "IMAGE_WIDGET",
        occurrence: 1,
      },
      {
        widgetType: "TEXT_WIDGET",
        occurrence: 2,
      },
      {
        widgetType: "INPUT_WIDGET_V2",
        occurrence: 1,
      },
    ]);
  });

  it("it doesn't re-generates meta widgets when only serverSizePagination is toggled while other options remains the same", () => {
    const listData = data.slice(0, 2);
    const { generator, options } = init({ data: listData });

    options.serverSidePagination = true;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("it doesn't re-generates meta widgets when templateBottomRow changes", () => {
    const { generator, options } = init();

    options.templateBottomRow += 100;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("disables widget operations non template rows", () => {
    const { initialResult } = init({ pageSize: 3 });
    const templateWidgetIds = Object.keys(simpleListInput.templateWidgets);

    const count = Object.keys(initialResult.metaWidgets).length;
    expect(count).toEqual(18);

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      if (!templateWidgetIds.includes(metaWidget.widgetId)) {
        expect(metaWidget.resizeDisabled).toEqual(true);
        expect(metaWidget.disablePropertyPane).toEqual(true);
        expect(metaWidget.dragDisabled).toEqual(true);
        expect(metaWidget.dropDisabled).toEqual(true);
        expect(metaWidget.ignoreCollision).toEqual(true);
        expect(metaWidget.shouldScrollContents).toEqual(undefined);
        expect(metaWidget.disabledResizeHandles).toEqual([
          "left",
          "top",
          "right",
          "bottomRight",
          "topLeft",
          "topRight",
          "bottomLeft",
        ]);
      }
    });
  });

  it("widget operations enabled on template row", () => {
    const { initialResult } = init();
    const templateWidgetIds = Object.keys(simpleListInput.templateWidgets);

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      if (templateWidgetIds.includes(metaWidget.widgetId)) {
        expect(metaWidget.resizeDisabled).toEqual(undefined);
        expect(metaWidget.disablePropertyPane).toEqual(undefined);
        expect(metaWidget.dropDisabled).toEqual(undefined);
        expect(metaWidget.ignoreCollision).toEqual(undefined);
        expect(metaWidget.disabledResizeHandles).toEqual(undefined);

        if (metaWidget.type === "CONTAINER_WIDGET") {
          expect(metaWidget.dragDisabled).toEqual(true);
        }
      }
    });
  });

  it("generates till it finds a nested list and not beyond that", () => {
    const { initialResult } = init({
      currTemplateWidgets: nestedListInput.templateWidgets,
      containerParentId: nestedListInput.containerParentId,
      containerWidgetId: nestedListInput.mainContainerId,
    });

    const count = Object.keys(initialResult.metaWidgets).length;

    expect(count).toEqual(12);
    expect(initialResult.removedMetaWidgetIds.length).toEqual(0);
  });

  it("adds LevelData to nested list", () => {
    const { initialResult } = init({
      currTemplateWidgets: nestedListInput.templateWidgets,
      containerParentId: nestedListInput.containerParentId,
      containerWidgetId: nestedListInput.mainContainerId,
    });

    const expectedLevelData = {
      level_1: {
        currentIndex: 0,
        currentItem: "{{List1.listData[0]}}",
        currentRowCache: {
          Image1: {
            entityDefinition: "image: Image1.image,isVisible: Image1.isVisible",
            rowIndex: 0,
            metaWidgetId: "623fj7t7ld",
            metaWidgetName: "Image1",
            viewIndex: 0,
            templateWidgetId: "623fj7t7ld",
            templateWidgetName: "Image1",
            type: "IMAGE_WIDGET",
          },
          Text1: {
            entityDefinition: "isVisible: Text1.isVisible,text: Text1.text",
            rowIndex: 0,
            metaWidgetId: "9qcijo7ri3",
            metaWidgetName: "Text1",
            viewIndex: 0,
            templateWidgetId: "9qcijo7ri3",
            templateWidgetName: "Text1",
            type: "TEXT_WIDGET",
          },
          Text2: {
            entityDefinition: "isVisible: Text2.isVisible,text: Text2.text",
            rowIndex: 0,
            metaWidgetId: "25x15bnona",
            metaWidgetName: "Text2",
            viewIndex: 0,
            templateWidgetId: "25x15bnona",
            templateWidgetName: "Text2",
            type: "TEXT_WIDGET",
          },
          List6: {
            entityDefinition:
              "backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,gridGap: List6.gridGap,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItemView: List6.triggeredItemView,items: List6.items,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,selectedItemIndex: List6.selectedItemIndex,triggeredItemIndex: List6.triggeredItemIndex",
            rowIndex: 0,
            metaWidgetId: "fs2d2lqjgd",
            metaWidgetName: "List6",
            viewIndex: 0,
            templateWidgetId: "fs2d2lqjgd",
            templateWidgetName: "List6",
            type: "LIST_WIDGET_V2",
          },
          Canvas2: {
            entityDefinition: "",
            rowIndex: 0,
            metaWidgetId: "qpgtpiw3cu",
            metaWidgetName: "Canvas2",
            viewIndex: 0,
            templateWidgetId: "qpgtpiw3cu",
            templateWidgetName: "Canvas2",
            type: "CANVAS_WIDGET",
          },
          Container1: {
            entityDefinition:
              "backgroundColor: Container1.backgroundColor,isVisible: Container1.isVisible",
            rowIndex: 0,
            metaWidgetId: "lneohookgm",
            metaWidgetName: "Container1",
            viewIndex: 0,
            templateWidgetId: "lneohookgm",
            templateWidgetName: "Container1",
            type: "CONTAINER_WIDGET",
          },
        },
        autocomplete: {
          currentItem: {
            id: 1,
            name: "Blue",
          },
          currentView: "{{Container1.data}}",
        },
      },
    };

    const nestedListWidgetId = "fs2d2lqjgd";
    const metaListWidget = initialResult.metaWidgets[nestedListWidgetId];

    Object.values(initialResult.metaWidgets).map((metaWidget) => {
      if (metaWidget.type === "LIST_WIDGET_V2") {
        expect(metaWidget.level).toEqual(2);
      }
    });

    expect(metaListWidget.levelData).toEqual(expectedLevelData);
  });

  it("generates meta widgets for nestedList widget", () => {
    const cache = new Cache();

    const generator = new MetaWidgetGenerator({
      getWidgetCache: cache.getWidgetCache,
      setWidgetCache: cache.setWidgetCache,
      infiniteScroll: false,
      widgetId: "test",
      isListCloned: false,
      level: 2,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });

    const nestedListWidgetId = "fs2d2lqjgd";
    const nestedListWidget =
      nestedListInput.templateWidgets[nestedListWidgetId];

    const initialResult = generator
      .withOptions({
        ...DEFAULT_OPTIONS,
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListWidget.mainCanvasId,
        containerWidgetId: nestedListWidget.mainContainerId,
        levelData,
        pageSize: 3,
        widgetName: "List6",
      })
      .generate();

    const count = Object.keys(initialResult.metaWidgets).length;
    expect(count).toEqual(15);
    expect(initialResult.removedMetaWidgetIds.length).toEqual(0);
  });

  it("updates the bindings properties that use currentItem, currentView, currentIndex and level_", () => {
    const cache = new Cache();

    const generator = new MetaWidgetGenerator({
      getWidgetCache: cache.getWidgetCache,
      setWidgetCache: cache.setWidgetCache,
      infiniteScroll: false,
      widgetId: "fs2d2lqjgd",
      isListCloned: false,
      level: 2,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });
    const listWidgetName = "List6";
    const nestedListWidgetId = "fs2d2lqjgd";
    const nestedListWidget =
      nestedListInput.templateWidgets[nestedListWidgetId];
    const textWidgetId = "q8e2zhxsdb";
    const textWidgetName = "Text5";

    const expectedCurrentIndex = 0;
    const expectedCurrentItem = `{{${listWidgetName}.listData[${textWidgetName}.currentIndex]}}`;
    const expectedCurrentView =
      "{{{\n          Text4: {isVisible: Text4.isVisible,text: Text4.text}\n        }}}";
    const expectedLevel_1 = {
      currentItem: "{{List1.listData[0]}}",
      currentIndex: 0,
      currentView: {
        Text1: "{{{isVisible: Text1.isVisible,text: Text1.text}}}",
      },
    };

    const initialResult = generator
      .withOptions({
        ...DEFAULT_OPTIONS,
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListWidget.mainCanvasId,
        containerWidgetId: nestedListWidget.mainContainerId,
        levelData,
        pageSize: 3,
        widgetName: listWidgetName,
      })
      .generate();

    const textMetaWidget = initialResult.metaWidgets[textWidgetId];

    expect(textMetaWidget.currentIndex).toEqual(expectedCurrentIndex);
    expect(textMetaWidget.currentItem).toEqual(expectedCurrentItem);
    expect(textMetaWidget.currentView).toEqual(expectedCurrentView);
    expect(textMetaWidget.level_1).toEqual(expectedLevel_1);
  });

  it("adds data property to the container widget", () => {
    const { initialResult } = init({
      currTemplateWidgets: nestedListInput.templateWidgets,
      containerParentId: nestedListInput.containerParentId,
      containerWidgetId: nestedListInput.mainContainerId,
    });

    const expectedDataBinding =
      "{{\n      {\n        \n          Image1: { image: Image1.image,isVisible: Image1.isVisible }\n        ,\n          Text1: { isVisible: Text1.isVisible,text: Text1.text }\n        ,\n          Text2: { isVisible: Text2.isVisible,text: Text2.text }\n        ,\n          List6: { backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,gridGap: List6.gridGap,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItemView: List6.triggeredItemView,items: List6.items,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,selectedItemIndex: List6.selectedItemIndex,triggeredItemIndex: List6.triggeredItemIndex }\n        \n      }\n    }}";

    Object.values(initialResult.metaWidgets).forEach((widget) => {
      if (widget.type === "CONTAINER_WIDGET") {
        expect(widget.data).not.toBeUndefined();

        if (widget.widgetId === simpleListInput.mainContainerId) {
          expect(widget.data).toEqual(expectedDataBinding);
        }
      }
    });
  });
});

describe("#getStartIndex", () => {
  it("return valid starting index when Server Side Pagination is disabled", () => {
    const { generator, options } = init();

    const result1 = generator.getStartIndex();

    expect(result1).toEqual(0);

    options.pageNo = 3;

    const result2 = generator.withOptions(options).getStartIndex();

    expect(result2).toEqual(4);
  });

  it("return 0 when server side pagination is enabled", () => {
    const { generator, options } = init({ serverSidePagination: true });

    const result1 = generator.getStartIndex();

    expect(result1).toEqual(0);

    options.pageNo = 3;

    const result2 = generator.withOptions(options).getStartIndex();

    expect(result2).toEqual(0);
  });
});

describe("#getMetaContainers", () => {
  const { generator, options } = init();
  let page1Containers = {};

  it("returns meta containers", () => {
    const containers = generator.getMetaContainers();
    page1Containers = containers;

    expect(containers.ids.length).toEqual(2);
    expect(containers.names.length).toEqual(2);
  });

  it("returns new container on page change", () => {
    options.pageNo = 2;
    generator.withOptions(options).generate();

    const containers = generator.getMetaContainers();

    expect(containers.ids.length).toEqual(2);
    expect(containers.names.length).toEqual(2);
    expect(page1Containers).not.toEqual(containers);
  });

  it("return previously generated containers when previous page is visited", () => {
    options.pageNo = 1;
    generator.withOptions(options).generate();

    const containers = generator.getMetaContainers();

    expect(containers.ids.length).toEqual(2);
    expect(containers.names.length).toEqual(2);
    expect(page1Containers).toEqual(containers);
  });
});
