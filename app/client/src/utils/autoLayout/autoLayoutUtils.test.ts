import { FlexLayer, LayerChild } from "./autoLayoutTypes";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  getLayerIndexOfWidget,
  pasteWidgetInFlexLayers,
  updateFlexLayersOnDelete,
} from "./AutoLayoutUtils";
import { data } from "./testData";

describe("test AutoLayoutUtils methods", () => {
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
      );
      const result: CanvasWidgetsReduxState = updateFlexLayersOnDelete(
        updatedWidgets,
        "tg6jcd1kjp",
        parentId,
        false,
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
});
