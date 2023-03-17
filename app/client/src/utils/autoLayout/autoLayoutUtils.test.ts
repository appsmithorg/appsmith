import type { FlexLayer, LayerChild } from "./autoLayoutTypes";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  getCanvasDimensions,
  getFlexLayersForSelectedWidgets,
  getLayerIndexOfWidget,
  getNewFlexLayers,
  pasteWidgetInFlexLayers,
  updateFlexLayersOnDelete,
} from "./AutoLayoutUtils";
import { data, dataForgetCanvasDimensions } from "./testData";
import { FlexLayerAlignment } from "./constants";

describe("test AutoLayoutUtils methods", () => {
  const mainCanvasWidth = 960;
  describe("test updateFlexLayersOnDelete method", () => {
    it("should remove deleted widgets from flex layers of the parent", () => {
      const widgets = { ...data };
      const deletedWidgetId = "pt32jvs72k";
      const parentId = "a3lldg1wg9";
      const result: CanvasWidgetsReduxState = updateFlexLayersOnDelete(
        widgets,
        deletedWidgetId,
        parentId,
        false,
        mainCanvasWidth,
      );
      expect(result[parentId].flexLayers?.length).toEqual(1);
      const layerIndex = getLayerIndexOfWidget(
        result[parentId]?.flexLayers,
        deletedWidgetId,
      );
      expect(layerIndex).toEqual(-1);
    });
    it("should return the layers as is, if the deleted widget does not exist in them", () => {
      const widgets = { ...data };
      const deletedWidgetId = "33";
      const parentId = "a3lldg1wg9";
      const result: CanvasWidgetsReduxState = updateFlexLayersOnDelete(
        widgets,
        deletedWidgetId,
        parentId,
        false,
        mainCanvasWidth,
      );
      expect(result[parentId].flexLayers?.length).toEqual(1);
      expect(result[parentId].flexLayers[0]?.children.length).toEqual(2);
    });
    it("should discard empty layers after removing deleted widgets", () => {
      const widgets = { ...data };
      const parentId = "a3lldg1wg9";
      const updatedWidgets: CanvasWidgetsReduxState = updateFlexLayersOnDelete(
        widgets,
        "pt32jvs72k",
        parentId,
        false,
        mainCanvasWidth,
      );
      const result: CanvasWidgetsReduxState = updateFlexLayersOnDelete(
        updatedWidgets,
        "tg6jcd1kjp",
        parentId,
        false,
        mainCanvasWidth,
      );
      expect(result[parentId].flexLayers?.length).toEqual(0);
    });
  });

  describe("test pasteWidgetInFlexLayers method", () => {
    it("should add the pasted widget to a new layer at the bottom of the parent, if the new parent is different from the original", () => {
      let widgets = { ...data };
      const originalWidgetId = "pt32jvs72k";
      const newParentId = "2ydfwnmayi";
      expect(widgets[newParentId].flexLayers?.length).toEqual(0);

      const copiedWidget = {
        ...widgets["pt32jvs72k"],
        widgetId: "abcdef123",
        widgetName: widgets["pt32jvs72k"].widgetName + "Copy",
        key:
          widgets["pt32jvs72k"].key.slice(
            0,
            widgets["pt32jvs72k"].key.length - 2,
          ) + "yz",
        parentId: newParentId,
      };
      widgets = { ...widgets, [copiedWidget.widgetId]: copiedWidget };
      const result: CanvasWidgetsReduxState = pasteWidgetInFlexLayers(
        widgets,
        newParentId,
        copiedWidget,
        originalWidgetId,
        false,
        mainCanvasWidth,
      );

      expect(result[newParentId].flexLayers?.length).toEqual(1);
      expect(
        getLayerIndexOfWidget(
          result[newParentId]?.flexLayers,
          copiedWidget.widgetId,
        ),
      ).toEqual(0);
    });
    it("should paste the copied widget in the same layer and to the right of the original widget, if the parentId remains the same", () => {
      let widgets = { ...data };
      const originalWidgetId = "pt32jvs72k";
      const parentId = "a3lldg1wg9";
      /**
       *  Update original parent's flexLayers to ramp up the layer count.
       * => split each child into a new layer.
       */
      const layers: FlexLayer[] = [];
      for (const layer of widgets[parentId].flexLayers) {
        for (const child of layer.children) {
          layers.push({
            children: [child as LayerChild],
          });
        }
      }
      widgets = {
        ...widgets,
        [parentId]: { ...widgets[parentId], flexLayers: layers },
      };
      expect(widgets[parentId].flexLayers?.length).toEqual(2);

      const copiedWidget = {
        ...widgets["pt32jvs72k"],
        widgetId: "abcdef123",
        widgetName: widgets["pt32jvs72k"].widgetName + "Copy",
        key:
          widgets["pt32jvs72k"].key.slice(
            0,
            widgets["pt32jvs72k"].key.length - 2,
          ) + "yz",
        parentId: parentId,
      };
      widgets = { ...widgets, [copiedWidget.widgetId]: copiedWidget };
      const result: CanvasWidgetsReduxState = pasteWidgetInFlexLayers(
        widgets,
        parentId,
        copiedWidget,
        originalWidgetId,
        false,
        mainCanvasWidth,
      );
      // layer count should remain the same. => no new layer is created.
      expect(result[parentId].flexLayers?.length).toEqual(2);
      // new widget should be pasted in the same layer as the original
      expect(
        getLayerIndexOfWidget(
          result[parentId]?.flexLayers,
          copiedWidget.widgetId,
        ),
      ).toEqual(
        getLayerIndexOfWidget(result[parentId]?.flexLayers, originalWidgetId),
      );
    });
  });

  describe("test getCanvasDimensions method", () => {
    /**
     * +---------------------------------------------------------------------------------------+
     * | MainContainer                                                                         |
     * | +-----------------------------------------------------------------------------------+ |
     * | | Container1                                                                        | |
     * | +-----------------------------------------------------------------------------------+ |
     * | +------------------+ +------------------+ +------------------+ +--------------------+ |
     * | |    Container2    | |                  | |                  | |                    | |
     * | +------------------+ +------------------+ +------------------+ +--------------------+ |
     * | +-----------------------------------------------------------------------------------+ |
     * | | +----------------+ +------------------+ +------------------+ +------------------+ | |
     * | | |   Container3   | |                  | |                  | |                  | | |
     * | | +----------------+ +------------------+ +------------------+ +------------------+ | |
     * | +-----------------------------------------------------------------------------------+ |
     * +---------------------------------------------------------------------------------------+
     */
    const mainCanvasWidth = 1166;
    const widgets = dataForgetCanvasDimensions;
    const mainContainerPadding = 4 * 2;
    const containerPadding = (4 + 6) * 2;
    it("should return proper dimension for MainContainer", () => {
      const button0parent = widgets["kv4o6eopdn"]
        .parentId as keyof typeof widgets;
      const { canvasWidth } = getCanvasDimensions(
        widgets[button0parent] as any,
        widgets as any,
        mainCanvasWidth,
        false,
      );
      expect(canvasWidth).toEqual(mainCanvasWidth - mainContainerPadding);
    });

    it("should return proper dimension for Container1", () => {
      const button1parent = widgets["phf8e237zg"]
        .parentId as keyof typeof widgets;
      const { canvasWidth } = getCanvasDimensions(
        widgets[button1parent] as any,
        widgets as any,
        mainCanvasWidth,
        false,
      );
      expect(canvasWidth).toEqual(
        mainCanvasWidth - mainContainerPadding - containerPadding,
      );
    });

    it("should return proper dimension for Container2", () => {
      const button2parent = widgets["alvcydt4he"]
        .parentId as keyof typeof widgets;
      const { canvasWidth } = getCanvasDimensions(
        widgets[button2parent] as any,
        widgets as any,
        mainCanvasWidth,
        false,
      );
      expect(canvasWidth).toEqual(
        (mainCanvasWidth - mainContainerPadding) / 4 - containerPadding,
      );
    });

    it("should return proper dimension for Container3", () => {
      const button3parent = widgets["cq25w8hz6n"]
        .parentId as keyof typeof widgets;
      const { canvasWidth } = getCanvasDimensions(
        widgets[button3parent] as any,
        widgets as any,
        mainCanvasWidth,
        false,
      );
      expect(canvasWidth).toEqual(
        (mainCanvasWidth - mainContainerPadding - containerPadding) / 4 -
          containerPadding,
      );
    });
  });

  it("should test getFlexLayersForSelectedWidgets", () => {
    const parentCanvas = {
      flexLayers: [
        {
          children: [
            {
              id: "1",
              align: FlexLayerAlignment.Start,
            },
            {
              id: "2",
              align: FlexLayerAlignment.Start,
            },
            {
              id: "3",
              align: FlexLayerAlignment.Center,
            },
          ],
        },
        {
          children: [
            {
              id: "4",
              align: FlexLayerAlignment.Start,
            },
          ],
        },
        {
          children: [
            {
              id: "5",
              align: FlexLayerAlignment.Center,
            },
            {
              id: "6",
              align: FlexLayerAlignment.End,
            },
          ],
        },
      ],
    } as any as FlattenedWidgetProps;

    const selectedWidgets = ["2", "3", "6"];

    const selectedFlexLayers = [
      {
        children: [
          {
            id: "2",
            align: FlexLayerAlignment.Start,
          },
          {
            id: "3",
            align: FlexLayerAlignment.Center,
          },
        ],
      },
      {
        children: [
          {
            id: "6",
            align: FlexLayerAlignment.End,
          },
        ],
      },
    ];

    expect(
      getFlexLayersForSelectedWidgets(selectedWidgets, parentCanvas),
    ).toEqual(selectedFlexLayers);
  });

  it("should test getNewFlexLayers", () => {
    const flexLayers = [
      {
        children: [
          {
            id: "1",
            align: FlexLayerAlignment.Start,
          },
          {
            id: "2",
            align: FlexLayerAlignment.Start,
          },
          {
            id: "3",
            align: FlexLayerAlignment.Center,
          },
        ],
      },
      {
        children: [
          {
            id: "4",
            align: FlexLayerAlignment.Start,
          },
        ],
      },
      {
        children: [
          {
            id: "5",
            align: FlexLayerAlignment.Center,
          },
          {
            id: "6",
            align: FlexLayerAlignment.End,
          },
        ],
      },
    ];

    const widgetIdMap = {
      "1": "11",
      "2": "22",
      "3": "33",
      "4": "44",
      "5": "55",
      "6": "66",
    };

    const newFlexLayers = [
      {
        children: [
          {
            id: "11",
            align: FlexLayerAlignment.Start,
          },
          {
            id: "22",
            align: FlexLayerAlignment.Start,
          },
          {
            id: "33",
            align: FlexLayerAlignment.Center,
          },
        ],
      },
      {
        children: [
          {
            id: "44",
            align: FlexLayerAlignment.Start,
          },
        ],
      },
      {
        children: [
          {
            id: "55",
            align: FlexLayerAlignment.Center,
          },
          {
            id: "66",
            align: FlexLayerAlignment.End,
          },
        ],
      },
    ];

    expect(getNewFlexLayers(flexLayers, widgetIdMap)).toEqual(newFlexLayers);
  });
});
