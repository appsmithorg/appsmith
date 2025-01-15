import { difference } from "lodash";
import { klona } from "klona";

import type { ConstructorProps, GeneratorOptions } from "./MetaWidgetGenerator";
import MetaWidgetGenerator from "./MetaWidgetGenerator";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { nestedListInput, simpleListInput } from "./testData";
import { RenderModes } from "constants/WidgetConstants";
import { ButtonFactory } from "test/factories/Widgets/ButtonFactory";
import type { LevelData } from "./widget";
import ImageWidget from "widgets/ImageWidget";
import TextWidget from "widgets/TextWidget";
import ListWidget from "widgets/ListWidgetV2";
import CanvasWidget from "widgets/CanvasWidget";
import ContainerWidget from "widgets/ContainerWidget";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";

interface Validator {
  widgetType: string;
  occurrence: number;
}

interface InitProps {
  optionsProps?: Partial<GeneratorOptions>;
  constructorProps?: Partial<ConstructorProps>;
  passedCache?: Cache;
  listWidgetId?: string;
}

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
  itemSpacing: 8,
  infiniteScroll: false,
  levelData: undefined,
  prevTemplateWidgets: {},
  primaryKeys: data.map((d) => d.id.toString()),
  scrollElement: null,
  templateHeight: 120,
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
          "backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,itemSpacing: List6.itemSpacing,selectedItem: List6.selectedItem,triggeredItem: List6.triggeredItem,selectedItemView: List6.selectedItemView,triggeredItemView: List6.triggeredItemView,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize",
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> = {};
  refData = {};

  getWidgetCache = (widgetId: string) => {
    return this.data[widgetId];
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWidgetCache = (widgetId: string, data: any) => {
    this.data[widgetId] = klona(data);
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWidgetReferenceCache = (data: any) => {
    this.refData = data;
  };

  getWidgetReferenceCache = () => {
    return this.refData;
  };
}

const init = ({
  constructorProps,
  listWidgetId = "DEFAULT_LIST_ID",
  optionsProps,
  passedCache,
}: InitProps = {}) => {
  const options = klona({
    ...DEFAULT_OPTIONS,
    ...optionsProps,
  });
  const cache = passedCache || new Cache();

  const generator = new MetaWidgetGenerator({
    getWidgetCache: () => cache.getWidgetCache(listWidgetId),
    setWidgetCache: (data) => cache.setWidgetCache(listWidgetId, data),
    infiniteScroll: false,
    isListCloned: false,
    level: 1,
    onVirtualListScroll: jest.fn,
    primaryWidgetType: "LIST_WIDGET_V2",
    renderMode: RenderModes.CANVAS,
    prefixMetaWidgetId: "test",
    setWidgetReferenceCache: cache.setWidgetReferenceCache,
    getWidgetReferenceCache: cache.getWidgetReferenceCache,
    ...constructorProps,
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

beforeAll(() => {
  registerWidgets([
    ImageWidget,
    TextWidget,
    ListWidget,
    CanvasWidget,
    ContainerWidget,
  ]);
});

describe("#generate", () => {
  it("generates meta widgets for first instance", () => {
    const { initialResult } = init();

    const expectedGeneratedCount = 12;
    const expectedRemovedCount = 0;

    const { metaWidgets, removedMetaWidgetIds } = initialResult;

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

  it("re-generates meta widgets data change", () => {
    const { generator, options } = init();

    const newData = [
      { id: 2, name: "Pink" },
      { id: 3, name: "Black" },
      { id: 4, name: "White" },
    ];

    options.data = newData;
    options.primaryKeys = newData.map((d) => d.id.toString());

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(12);
    expect(result.removedMetaWidgetIds.length).toEqual(6);

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

  it("does not re-generates meta widgets when options don't change", () => {
    const { generator, options } = init();

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("re-generates meta widgets when template widgets change", () => {
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
    delete nextTemplateWidget2.epowimtfiu; // Image widget

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

  it("re-generates meta widgets when page no changes in edit mode", () => {
    const { generator, options } = init();

    options.pageNo = 2;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(12);
    expect(result.removedMetaWidgetIds.length).toEqual(6);

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

  it("re-generates meta widgets when page no changes in view mode", () => {
    const { generator, options } = init({
      constructorProps: { renderMode: RenderModes.PAGE },
    });

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

  it("generates only extra meta widgets when page size increases", () => {
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

  it("removes meta widgets when page size decreases", () => {
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

  it("re-generates all meta widgets when primary keys changes in page > 1", () => {
    const { generator, options } = init({ optionsProps: { pageNo: 2 } });

    options.primaryKeys = options.primaryKeys.map((i) => i + "100");

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(12);
    expect(result.removedMetaWidgetIds.length).toEqual(6);

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

  it("re-generates non template meta widgets when primary keys changes in page = 1", () => {
    const { generator, options } = init();

    options.primaryKeys = options.primaryKeys.map((i) => i + "100");

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    // template and non template meta widgets will update
    expect(count).toEqual(12);
    // non template meta widgets will get removed
    expect(result.removedMetaWidgetIds.length).toEqual(6);

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

  it("doesn't re-generates meta widgets when only serverSizePagination is toggled while other options remains the same", () => {
    const listData = data.slice(0, 2);
    const { generator, options } = init({ optionsProps: { data: listData } });

    options.serverSidePagination = true;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("doesn't re-generates meta widgets when templateHeight changes", () => {
    const { generator, options } = init();

    options.templateHeight += 1000;

    const result = generator.withOptions(options).generate();
    const count = Object.keys(result.metaWidgets).length;

    expect(count).toEqual(0);
    expect(result.removedMetaWidgetIds.length).toEqual(0);
  });

  it("disables widget operations non template rows", () => {
    const { initialResult } = init({ optionsProps: { pageSize: 3 } });
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

        if (metaWidget.type === "CONTAINER_WIDGET") {
          expect(metaWidget.dragDisabled).toEqual(true);
          expect(metaWidget.disabledResizeHandles).toEqual([
            "left",
            "top",
            "right",
            "bottomRight",
            "topLeft",
            "topRight",
            "bottomLeft",
          ]);
        } else {
          expect(metaWidget.disabledResizeHandles).toEqual(undefined);
        }
      }
    });
  });

  it("generates till it finds a nested list and not beyond that", () => {
    const { initialResult } = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
      },
    });

    const count = Object.keys(initialResult.metaWidgets).length;

    expect(count).toEqual(12);
    expect(initialResult.removedMetaWidgetIds.length).toEqual(0);
  });

  it("adds LevelData to nested list", () => {
    const { initialResult } = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
      },
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
              "backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,itemSpacing: List6.itemSpacing,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItem: List6.triggeredItem,triggeredItemView: List6.triggeredItemView,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,currentItemsView: List6.currentItemsView",
            rowIndex: 0,
            metaWidgetId: "fs2d2lqjgd",
            metaWidgetName: "List6",
            viewIndex: 0,
            templateWidgetId: "fs2d2lqjgd",
            templateWidgetName: "List6",
            type: "LIST_WIDGET_V2",
          },
          Canvas1: {},
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
          currentView: `{{((data, blackListArr) => {
              const newObj = {};

              for (const key in data) {
                if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
                  newObj[key] = Object.fromEntries(
                    Object.entries(data[key]).filter(
                      ([nestedKey]) => !blackListArr.includes(nestedKey)
                    )
                  );
                }
              }
              return newObj;
              })(Container1.data, [\"selectedItemView\",\"triggeredItemView\",\"currentItemsView\"] )
          }}`,
        },
      },
    };

    const nestedListWidgetId = "fs2d2lqjgd";
    const metaListWidget = initialResult.metaWidgets[nestedListWidgetId];

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      if (metaWidget.type === "LIST_WIDGET_V2") {
        expect(metaWidget.level).toEqual(2);
      }
    });

    expect(metaListWidget.levelData).toEqual(expectedLevelData);
  });

  it("generates meta widgets for nestedList widget", () => {
    const nestedListWidgetId = "fs2d2lqjgd";
    const nestedListWidget =
      nestedListInput.templateWidgets[nestedListWidgetId];

    const cache = new Cache();

    const generator = new MetaWidgetGenerator({
      getWidgetCache: () => cache.getWidgetCache(nestedListWidgetId),
      setWidgetCache: (data) => cache.setWidgetCache(nestedListWidgetId, data),
      getWidgetReferenceCache: cache.getWidgetReferenceCache,
      setWidgetReferenceCache: cache.setWidgetReferenceCache,
      infiniteScroll: false,
      prefixMetaWidgetId: "test",
      isListCloned: false,
      level: 2,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });

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

  it("removed BlackListed properties from Parent InnerList", () => {
    const nestedTextWidgetId = "dkk5yh9urt";

    const nestedListWidgetId = "fs2d2lqjgd";
    const nestedListWidget =
      nestedListInput.templateWidgets[nestedListWidgetId];

    const cache = new Cache();

    const generator = new MetaWidgetGenerator({
      getWidgetCache: () => cache.getWidgetCache(nestedListWidgetId),
      setWidgetCache: (data) => cache.setWidgetCache(nestedListWidgetId, data),
      getWidgetReferenceCache: cache.getWidgetReferenceCache,
      setWidgetReferenceCache: cache.setWidgetReferenceCache,
      infiniteScroll: false,
      prefixMetaWidgetId: "test",
      isListCloned: false,
      level: 2,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });

    const initialResult = generator
      .withOptions({
        ...DEFAULT_OPTIONS,
        currTemplateWidgets: {
          ...nestedListInput.templateWidgets,
          dkk5yh9urt: {
            ...nestedListInput.templateWidgets[nestedTextWidgetId],
            text: "{{level_1.currentView.List6}}",
          },
        },
        containerParentId: nestedListWidget.mainCanvasId,
        containerWidgetId: nestedListWidget.mainContainerId,
        levelData,
        pageSize: 3,
        widgetName: "List6",
      })
      .generate();

    const expectedLevel_1 = {
      currentView: {
        List6:
          "{{{backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,itemSpacing: List6.itemSpacing,selectedItem: List6.selectedItem,triggeredItem: List6.triggeredItem,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize}}}",
      },
    };

    const metaNestedTextWidget = initialResult.metaWidgets[nestedTextWidgetId];

    expect(metaNestedTextWidget.level_1).toEqual(expectedLevel_1);
  });

  it("updates the bindings properties that use currentItem, currentView, currentIndex and level_", () => {
    const listWidgetName = "List6";
    const nestedListWidgetId = "fs2d2lqjgd";

    const cache = new Cache();
    const generator = new MetaWidgetGenerator({
      getWidgetCache: () => cache.getWidgetCache(nestedListWidgetId),
      setWidgetCache: (data) => cache.setWidgetCache(nestedListWidgetId, data),
      getWidgetReferenceCache: cache.getWidgetReferenceCache,
      setWidgetReferenceCache: cache.setWidgetReferenceCache,
      infiniteScroll: false,
      prefixMetaWidgetId: "fs2d2lqjgd",
      isListCloned: false,
      level: 2,
      onVirtualListScroll: jest.fn,
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: RenderModes.CANVAS,
    });

    const nestedListWidget =
      nestedListInput.templateWidgets[nestedListWidgetId];
    const textWidgetId = "q8e2zhxsdb";
    const textWidgetName = "Text5";

    const expectedCurrentIndex = 0;
    const expectedCurrentItem = `{{${listWidgetName}.listData[${textWidgetName}.currentIndex]}}`;
    const expectedCurrentView =
      "{{{\n            Text4: {isVisible: Text4.isVisible,text: Text4.text}\n          }}}";
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
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
      },
    });

    const expectedDataBinding =
      "{{\n      {\n        \n          Image1: { image: Image1.image,isVisible: Image1.isVisible }\n        ,\n          Text1: { isVisible: Text1.isVisible,text: Text1.text }\n        ,\n          Text2: { isVisible: Text2.isVisible,text: Text2.text }\n        ,\n          List6: { backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,itemSpacing: List6.itemSpacing,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItemView: List6.triggeredItemView,items: List6.items,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,selectedItemIndex: List6.selectedItemIndex,triggeredItemIndex: List6.triggeredItemIndex }\n        \n      }\n    }}";

    Object.values(initialResult.metaWidgets).forEach((widget) => {
      if (widget.type === "CONTAINER_WIDGET") {
        expect(widget.data).not.toBeUndefined();

        if (widget.widgetId === simpleListInput.mainContainerId) {
          expect(widget.data).toEqual(expectedDataBinding);
        }
      }
    });
  });

  it("only the template meta widgets should have the actual widget name references in the bindings", () => {
    const { generator, initialResult, options } = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
      },
    });

    options.pageSize = 3;
    options.data = [
      { id: 0, name: "Green" },
      { id: 1, name: "Blue" },
      { id: 2, name: "Pink" },
      { id: 3, name: "Black" },
      { id: 4, name: "White" },
    ];
    options.primaryKeys = options.data.map((d) => (d.id as number).toString());

    const { metaWidgets, removedMetaWidgetIds } = generator
      .withOptions(options)
      .generate();

    const generatedMetaWidgets = {
      ...initialResult.metaWidgets,
      ...metaWidgets,
    };

    const expectedDataBinding =
      "{{\n      {\n        \n          Image1: { image: Image1.image,isVisible: Image1.isVisible }\n        ,\n          Text1: { isVisible: Text1.isVisible,text: Text1.text }\n        ,\n          Text2: { isVisible: Text2.isVisible,text: Text2.text }\n        ,\n          List6: { backgroundColor: List6.backgroundColor,isVisible: List6.isVisible,itemSpacing: List6.itemSpacing,selectedItem: List6.selectedItem,selectedItemView: List6.selectedItemView,triggeredItem: List6.triggeredItem,triggeredItemView: List6.triggeredItemView,listData: List6.listData,pageNo: List6.pageNo,pageSize: List6.pageSize,currentItemsView: List6.currentItemsView }\n        \n      }\n    }}";

    const count = Object.keys(metaWidgets).length;

    expect(count).toEqual(18);
    expect(removedMetaWidgetIds.length).toEqual(0);

    Object.values(generatedMetaWidgets).forEach((widget) => {
      if (widget.type === "CONTAINER_WIDGET") {
        expect(widget.data).not.toBeUndefined();

        if (widget.widgetId === nestedListInput.mainContainerId) {
          expect(widget.data).toEqual(expectedDataBinding);
        } else {
          expect(widget.data).not.toEqual(expectedDataBinding);
        }
      }
    });
  });

  it("generates all meta widget and removes non first item meta widget when data re-shuffles in Edit mode", () => {
    const page1Data = [
      { id: 1, name: "Blue" },
      { id: 2, name: "Pink" },
    ];
    const page1PrimaryKeys = page1Data.map((d) => d.id.toString());

    const page2Data = [
      { id: 3, name: "Red" },
      { id: 4, name: "Blue" },
    ];
    const page2PrimaryKeys = page2Data.map((d) => d.id.toString());

    /**
     * Here page1Data's first item got shuffled into 2nd item and
     * first item has id 5
     */
    const updatedPage1Data = [
      { id: 5, name: "Green" },
      { id: 1, name: "White" },
    ];
    const updatePage1PrimaryKeys = updatedPage1Data.map((d) => d.id.toString());

    const { generator, initialResult, options } = init({
      optionsProps: {
        data: page1Data,
        primaryKeys: page1PrimaryKeys,
        serverSidePagination: true,
      },
    });

    const count1 = Object.keys(initialResult.metaWidgets).length;

    expect(count1).toEqual(12);
    expect(initialResult.removedMetaWidgetIds.length).toEqual(0);

    const result2 = generator
      .withOptions({
        ...options,
        data: page2Data,
        primaryKeys: page2PrimaryKeys,
        pageNo: 2,
      })
      .generate();

    const count2 = Object.keys(result2.metaWidgets).length;

    expect(count2).toEqual(12);
    expect(result2.removedMetaWidgetIds.length).toEqual(6);

    const result3 = generator
      .withOptions({
        ...options,
        data: updatedPage1Data,
        primaryKeys: updatePage1PrimaryKeys,
        pageNo: 1,
      })
      .generate();

    const count3 = Object.keys(result3.metaWidgets).length;

    expect(count3).toEqual(12);
    expect(result3.removedMetaWidgetIds.length).toEqual(6);
  });

  it("generates all meta widget and removes all meta widget when data re-shuffles in View mode", () => {
    const page1Data = [
      { id: 1, name: "Blue" },
      { id: 2, name: "Pink" },
    ];
    const page1PrimaryKeys = page1Data.map((d) => d.id.toString());

    const page2Data = [
      { id: 3, name: "Red" },
      { id: 4, name: "Blue" },
    ];
    const page2PrimaryKeys = page2Data.map((d) => d.id.toString());

    /**
     * Here page1Data's first item got shuffled into 2nd item and
     * first item has id 5
     */
    const updatedPage1Data = [
      { id: 5, name: "Green" },
      { id: 1, name: "White" },
    ];
    const updatePage1PrimaryKeys = updatedPage1Data.map((d) => d.id.toString());

    const { generator, initialResult, options } = init({
      constructorProps: {
        renderMode: RenderModes.PAGE,
      },
      optionsProps: {
        data: page1Data,
        primaryKeys: page1PrimaryKeys,
        serverSidePagination: true,
      },
    });

    const count1 = Object.keys(initialResult.metaWidgets).length;

    expect(count1).toEqual(12);
    expect(initialResult.removedMetaWidgetIds.length).toEqual(0);

    const result2 = generator
      .withOptions({
        ...options,
        data: page2Data,
        primaryKeys: page2PrimaryKeys,
        pageNo: 2,
      })
      .generate();

    const count2 = Object.keys(result2.metaWidgets).length;

    expect(count2).toEqual(12);
    expect(result2.removedMetaWidgetIds.length).toEqual(12);

    const result3 = generator
      .withOptions({
        ...options,
        data: updatedPage1Data,
        primaryKeys: updatePage1PrimaryKeys,
        pageNo: 1,
      })
      .generate();

    const count3 = Object.keys(result3.metaWidgets).length;

    expect(count3).toEqual(12);
    expect(result3.removedMetaWidgetIds.length).toEqual(12);
  });

  it("should not have any template widgets when renderMode is PAGE", () => {
    const { initialResult, options } = init({
      constructorProps: { renderMode: RenderModes.PAGE },
    });

    const templateWidgetNames = Object.values(options.currTemplateWidgets).map(
      (w) => w.widgetName,
    );
    const templateWidgetIds = Object.keys(options.currTemplateWidgets);

    Object.values(initialResult.metaWidgets).forEach(
      ({ widgetId, widgetName }) => {
        expect(templateWidgetIds).not.toContain(widgetId);
        expect(templateWidgetNames).not.toContain(widgetName);
      },
    );
  });

  it("should have some template widgets and some meta widgets when renderMode is CANVAS", () => {
    const { initialResult } = init();

    const options = DEFAULT_OPTIONS;
    const { currTemplateWidgets } = options;

    const { metaWidgets } = initialResult;
    const templateWidgetIds = Object.keys(currTemplateWidgets);

    const templateWidgetCount = Object.values(metaWidgets).reduce(
      (count, metaWidget) => {
        if (templateWidgetIds.includes(metaWidget.widgetId)) {
          count += 1;
        }

        return count;
      },
      0,
    );
    const metaWidgetsCount = Object.keys(metaWidgets).length;
    const nonTemplateWidgetsCount = metaWidgetsCount - templateWidgetCount;

    expect(metaWidgetsCount).toEqual(12);
    expect(templateWidgetCount).toEqual(6);
    expect(nonTemplateWidgetsCount).toEqual(6);
  });

  it("should add metaWidgetId to all the meta widgets", () => {
    const { initialResult } = init();

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      expect(metaWidget.metaWidgetId).toBeDefined();
    });
  });

  it("should match the metaWidgetId and meta widget's widgetId for row > 0", () => {
    const { initialResult } = init();

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      if (metaWidget.currentIndex > 0) {
        expect(metaWidget.metaWidgetId).toEqual(metaWidget.widgetId);
      }
    });
  });

  it("should not match the widgetId and meta widget's widgetId for 0th row for every page", () => {
    const { generator, initialResult, options } = init();

    const startIndex = (options.pageNo - 1) * options.pageSize;

    Object.values(initialResult.metaWidgets).forEach((metaWidget) => {
      if (metaWidget.currentIndex === startIndex) {
        expect(metaWidget.metaWidgetId).not.toEqual(metaWidget.widgetId);
      } else {
        expect(metaWidget.metaWidgetId).toEqual(metaWidget.widgetId);
      }
    });

    options.pageNo = 2;

    const updatedStartIndex = (options.pageNo - 1) * options.pageSize;
    const result1 = generator.withOptions(options).generate();

    Object.values(result1.metaWidgets).forEach((metaWidget) => {
      if (metaWidget.currentIndex === updatedStartIndex) {
        expect(metaWidget.metaWidgetId).not.toEqual(metaWidget.widgetId);
      } else {
        expect(metaWidget.metaWidgetId).toEqual(metaWidget.widgetId);
      }
    });
  });

  it("should regenerate all meta widgets on page toggle and remove only non template widgets", () => {
    const { generator, options } = init();

    options.pageNo = 2;
    const result1 = generator.withOptions(options).generate();

    const count1 = Object.keys(result1.metaWidgets).length;

    expect(count1).toEqual(12);
    expect(result1.removedMetaWidgetIds.length).toEqual(6);

    options.pageNo = 1;
    const result2 = generator.withOptions(options).generate();
    const count2 = Object.keys(result2.metaWidgets).length;

    expect(count2).toEqual(12);
    expect(result2.removedMetaWidgetIds.length).toEqual(6);
  });

  it("in edit mode it updates siblingMetaWidgets in the template widget", () => {
    const { generator, initialResult, options } = init();

    options.pageNo = 2;
    const result1 = generator.withOptions(options).generate();

    Object.values(result1.metaWidgets).forEach((metaWidget) => {
      if (metaWidget.widgetId === metaWidget.metaWidgetId) {
        expect(metaWidget.siblingMetaWidgets).toBe(undefined);
      } else {
        const prevPageMetaWidgetIds = Object.values(initialResult.metaWidgets)
          .filter(
            ({ referencedWidgetId }) =>
              referencedWidgetId === metaWidget.widgetId,
          )
          .map(({ metaWidgetId }) => metaWidgetId);

        expect(metaWidget.siblingMetaWidgets).toStrictEqual(
          prevPageMetaWidgetIds,
        );
      }
    });
  });

  it("in view mode it updates siblingMetaWidgets in one of the candidate meta widget", () => {
    const { generator, initialResult, options } = init({
      constructorProps: { renderMode: RenderModes.PAGE },
    });

    options.pageNo = 2;
    const result1 = generator.withOptions(options).generate();

    // Object of templateWidget: candidateMetaWidget[]
    // If any one of the object properties has more than 1 candidateMetaWidget then siblingMetaWidgets is
    // being stored in more than on meta widget for a particular template widget.
    const candidateMetaWidgets: Record<string, string[]> = {};

    Object.values(result1.metaWidgets).forEach((metaWidget) => {
      const {
        referencedWidgetId = "",
        siblingMetaWidgets,
        widgetId,
      } = metaWidget;

      if (siblingMetaWidgets) {
        if (!Array.isArray(candidateMetaWidgets[referencedWidgetId])) {
          candidateMetaWidgets[referencedWidgetId] = [widgetId];
        } else {
          candidateMetaWidgets[referencedWidgetId].push(widgetId);
        }
      }
    });

    Object.values(candidateMetaWidgets).forEach((candidateWidgets) => {
      const [candidateWidgetId] = candidateWidgets;
      const candidateWidget = result1.metaWidgets[candidateWidgetId];
      const prevPageMetaWidgetIds = Object.values(initialResult.metaWidgets)
        .filter(
          ({ referencedWidgetId }) =>
            referencedWidgetId === candidateWidget.referencedWidgetId,
        )
        .map(({ metaWidgetId }) => metaWidgetId);

      expect(candidateWidgets.length).toBe(1);
      expect(candidateWidget.siblingMetaWidgets).toStrictEqual(
        prevPageMetaWidgetIds,
      );
    });
  });

  it("captures all siblingMetaWidgets in the first inner list's widget in a nested list setup", () => {
    const cache = new Cache();
    const nestedList1Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["1_1", "1_2", "1_3", "1_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
      },
      passedCache: cache,
    });

    const nestedList2Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["2_1", "2_2", "2_3", "2_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
      },
      passedCache: cache,
    });

    const page1MetaWidgets = {
      ...nestedList1Page1.initialResult.metaWidgets,
      ...nestedList2Page1.initialResult.metaWidgets,
    };

    /**
     * We are considering nestedList2Page1 as nestedList2Page1 and nestedList1Page1 both together
     * form the page1's nested list and since we have to generate the inner lists as separate to mimic
     * the actual behaviour so the nestedList2Page1 would give the most updated siblings updates
     *  */
    const page1PropertyUpdates = nestedList2Page1.initialResult.propertyUpdates;

    expect(page1PropertyUpdates).not.toStrictEqual([]);

    page1PropertyUpdates.forEach(({ path, value: siblingsIds }) => {
      const [candidateWidgetId] = path.split(".");
      const candidateWidget = page1MetaWidgets[candidateWidgetId];
      const expectedSiblings = Object.values(page1MetaWidgets)
        .filter(
          ({ referencedWidgetId }) =>
            referencedWidgetId === candidateWidget.referencedWidgetId,
        )
        .map(({ metaWidgetId }) => metaWidgetId);

      expect(siblingsIds).toStrictEqual(expectedSiblings);
    });

    // Page 2
    const nestedList1Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["3_1", "3_2", "3_3", "3_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
      },
      passedCache: cache,
    });

    const nestedList2Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["4_1", "4_2", "4_3", "4_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
      },
      passedCache: cache,
    });

    const page2MetaWidgets = {
      ...nestedList1Page2.initialResult.metaWidgets,
      ...nestedList2Page2.initialResult.metaWidgets,
    };

    const allMetaWidgets = [
      ...Object.values(page1MetaWidgets),
      ...Object.values(page2MetaWidgets),
    ];

    const page2PropertyUpdates = nestedList2Page2.initialResult.propertyUpdates;

    expect(page2PropertyUpdates).not.toStrictEqual([]);

    expect(page2PropertyUpdates).not.toStrictEqual([]);
    page2PropertyUpdates.forEach(({ path, value: siblingsIds }) => {
      const [candidateWidgetId] = path.split(".");
      const candidateWidget = page2MetaWidgets[candidateWidgetId];
      const expectedSiblings = allMetaWidgets
        .filter(
          ({ referencedWidgetId }) =>
            referencedWidgetId === candidateWidget.referencedWidgetId,
        )
        .map(({ metaWidgetId }) => metaWidgetId);

      expect(siblingsIds).toStrictEqual(expectedSiblings);
    });
  });
});

describe("#getContainerParentCache", () => {
  it("always returns template item for fist item and non template for rest of the items in edit mode", () => {
    const cache = new Cache();
    // Page 1 nested list widget
    const nestedList1Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["1_1", "1_2", "1_3", "1_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
      },
      passedCache: cache,
      listWidgetId: "list1",
    });

    const nestedList2Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["2_1", "2_2", "2_3", "2_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
      },
      passedCache: cache,
      listWidgetId: "list2",
    });

    const parentCacheList1Page1 = klona(
      nestedList1Page1.generator.getContainerParentCache(),
    );
    const parentCacheList2Page1 = klona(
      nestedList2Page1.generator.getContainerParentCache(),
    );

    // In page 2 we are trying to mimic if the items position got swapped i.e the 1st item is not 2nd and vice-versa
    const nestedList1Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["2_1", "2_2", "2_3", "2_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
      },
      passedCache: cache,
      listWidgetId: "list2",
    });

    const nestedList2Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["1_1", "1_2", "1_3", "1_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
      },
      passedCache: cache,
      listWidgetId: "list1",
    });

    const parentCacheList1Page2 = klona(
      nestedList1Page2.generator.getContainerParentCache(),
    );
    const parentCacheList2Page2 = klona(
      nestedList2Page2.generator.getContainerParentCache(),
    );

    // If the page 1 item 1 is equal to page 2 items 2
    expect(parentCacheList1Page1?.originalMetaWidgetId).toEqual(
      parentCacheList2Page2?.originalMetaWidgetId,
    );
    expect(parentCacheList1Page1?.originalMetaWidgetName).toEqual(
      parentCacheList2Page2?.originalMetaWidgetName,
    );

    // If the page 1 item 2 is equal to page 2 items 1
    expect(parentCacheList2Page1?.originalMetaWidgetId).toEqual(
      parentCacheList1Page2?.originalMetaWidgetId,
    );
    expect(parentCacheList2Page1?.originalMetaWidgetName).toEqual(
      parentCacheList1Page2?.originalMetaWidgetName,
    );

    // Page 1 item 1 is template item
    expect(parentCacheList1Page1?.metaWidgetId).toEqual(
      parentCacheList1Page1?.templateWidgetId,
    );
    // Page 1 item 2 is not template item
    expect(parentCacheList2Page1?.metaWidgetId).not.toEqual(
      parentCacheList1Page1?.templateWidgetId,
    );

    // Page 2 item 1 is template item
    expect(parentCacheList1Page2?.metaWidgetId).toEqual(
      parentCacheList1Page2?.templateWidgetId,
    );
    // Page 2 item 2 is not template item
    expect(parentCacheList2Page2?.metaWidgetId).not.toEqual(
      parentCacheList1Page2?.templateWidgetId,
    );
  });

  it("always returns template item for fist item and non template for rest of the items in view mode", () => {
    const cache = new Cache();
    // Page 1 nested list widget
    const nestedList1Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["1_1", "1_2", "1_3", "1_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
        renderMode: RenderModes.PAGE,
      },
      passedCache: cache,
      listWidgetId: "list1",
    });

    const nestedList2Page1 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["2_1", "2_2", "2_3", "2_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
        renderMode: RenderModes.PAGE,
      },
      passedCache: cache,
      listWidgetId: "list2",
    });

    const parentCacheList1Page1 = klona(
      nestedList1Page1.generator.getContainerParentCache(),
    );
    const parentCacheList2Page1 = klona(
      nestedList2Page1.generator.getContainerParentCache(),
    );

    // In page 2 we are trying to mimic if the items position got swapped i.e the 1st item is not 2nd and vice-versa
    const nestedList1Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 0,
        primaryKeys: ["2_1", "2_2", "2_3", "2_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: false,
        renderMode: RenderModes.PAGE,
      },
      passedCache: cache,
      listWidgetId: "list2",
    });

    const nestedList2Page2 = init({
      optionsProps: {
        currTemplateWidgets: nestedListInput.templateWidgets,
        containerParentId: nestedListInput.containerParentId,
        containerWidgetId: nestedListInput.mainContainerId,
        nestedViewIndex: 1,
        primaryKeys: ["1_1", "1_2", "1_3", "1_4"],
      },
      constructorProps: {
        level: 2,
        isListCloned: true,
        renderMode: RenderModes.PAGE,
      },
      passedCache: cache,
      listWidgetId: "list1",
    });

    const parentCacheList1Page2 = klona(
      nestedList1Page2.generator.getContainerParentCache(),
    );
    const parentCacheList2Page2 = klona(
      nestedList2Page2.generator.getContainerParentCache(),
    );

    // If the page 1 item 1 is equal to page 2 items 2
    expect(parentCacheList1Page1?.originalMetaWidgetId).toEqual(
      parentCacheList2Page2?.originalMetaWidgetId,
    );
    expect(parentCacheList1Page1?.originalMetaWidgetName).toEqual(
      parentCacheList2Page2?.originalMetaWidgetName,
    );

    // If the page 1 item 2 is equal to page 2 items 1
    expect(parentCacheList2Page1?.originalMetaWidgetId).toEqual(
      parentCacheList1Page2?.originalMetaWidgetId,
    );
    expect(parentCacheList2Page1?.originalMetaWidgetName).toEqual(
      parentCacheList1Page2?.originalMetaWidgetName,
    );

    // Page 1 item 1 is non template item
    expect(parentCacheList1Page1?.metaWidgetId).not.toEqual(
      parentCacheList1Page1?.templateWidgetId,
    );
    // Page 1 item 2 is not template item
    expect(parentCacheList2Page1?.metaWidgetId).not.toEqual(
      parentCacheList1Page1?.templateWidgetId,
    );

    // Page 2 item 1 is not template item
    expect(parentCacheList1Page2?.metaWidgetId).not.toEqual(
      parentCacheList1Page2?.templateWidgetId,
    );
    // Page 2 item 2 is not template item
    expect(parentCacheList2Page2?.metaWidgetId).not.toEqual(
      parentCacheList1Page2?.templateWidgetId,
    );
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

  it("return valid starting index when server side pagination is enabled", () => {
    const { generator, options } = init({
      optionsProps: { serverSidePagination: true },
    });

    const result1 = generator.getStartIndex();

    expect(result1).toEqual(0);

    options.pageNo = 3;

    const result2 = generator.withOptions(options).getStartIndex();

    expect(result2).toEqual(4);
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

  it("page 1 meta container should have the template widget name", () => {
    const containers = generator.getMetaContainers();

    expect(containers.names[0]).toEqual("Container1");
    expect(containers.names[1]).not.toEqual("Container1");
  });
});

describe("#updateWidgetNameInDynamicBinding", () => {
  const { generator } = init();
  const data = [
    {
      binding: "Text1.isValid + Text1 + Text1.text",
      metaWidgetName: "List12_Text1_szn8dmq3qq_txbxl5n484",
      templateWidgetName: "Text1",
      expected:
        "List12_Text1_szn8dmq3qq_txbxl5n484.isValid + Text1 + List12_Text1_szn8dmq3qq_txbxl5n484.text",
    },
    {
      binding:
        '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["name"]))}}',
      metaWidgetName: "List1_Table1_szn8dmq3qq_l21enk0im8",
      templateWidgetName: "Table1",
      expected:
        '{{List1_Table1_szn8dmq3qq_l21enk0im8.processedTableData.map((currentRow, currentIndex) => ( currentRow["name"]))}}',
    },
  ];

  it("returns meta containers", () => {
    data.forEach(
      ({ binding, expected, metaWidgetName, templateWidgetName }) => {
        const updatedBinding = generator.updateWidgetNameInDynamicBinding(
          binding,
          metaWidgetName,
          templateWidgetName,
        );

        expect(updatedBinding).toBe(expected);
      },
    );
  });

  it("returns same binding value when it falsy", () => {
    ["", undefined, null, false].forEach((d: unknown) => {
      const updatedBinding = generator.updateWidgetNameInDynamicBinding(
        d as string,
        "test",
        "test",
      );

      expect(updatedBinding).toBe(d);
    });
  });
});
