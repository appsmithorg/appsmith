import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  addNewLayer,
  createFlexLayer,
  removeWidgetsFromCurrentLayers,
  updateExistingLayer,
  updateRelationships,
} from "./autoLayoutDraggingUtils";
import { getLayerIndexOfWidget } from "./AutoLayoutUtils";
import { data } from "./testData";
import type { FlexLayer } from "./types";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

describe("test AutoLayoutDraggingUtils methods", () => {
  describe("test createFlexLayer method", () => {
    it("should return a new FlexLayer for given widgets and alignment", () => {
      const widgets = { ...data };
      const layer: FlexLayer = createFlexLayer(
        [widgets["tg6jcd1kjp"].widgetId],
        widgets,
        FlexLayerAlignment.Start,
      );
      expect(layer).toEqual({
        children: [{ id: "tg6jcd1kjp", align: FlexLayerAlignment.Start }],
      });
    });
    it("should exclude widgets that don't exist", () => {
      const widgets = { ...data };
      const layer: FlexLayer = createFlexLayer(
        ["33"],
        widgets,
        FlexLayerAlignment.Start,
      );
      expect(layer).toEqual({
        children: [],
      });
    });
  });
  describe("test removeWidgetsFromCurrentLayers method", () => {
    it("should remove the widget from given flex layers", () => {
      const widgets = { ...data };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layers: any[] = widgets["a3lldg1wg9"].flexLayers;
      const result: FlexLayer[] = removeWidgetsFromCurrentLayers(
        ["pt32jvs72k"],
        layers,
      );
      const layerIndex = getLayerIndexOfWidget(result, "pt32jvs72k");
      expect(result[0].children.length).toEqual(1);
      expect(layerIndex).toEqual(-1);
    });
    it("should return an empty array if the input layers are empty", () => {
      expect(removeWidgetsFromCurrentLayers(["pt32jvs72k"], [])).toEqual([]);
    });
    it("should return input flexLayers as is if moved widgets are not found amongst them", () => {
      const widgets = { ...data };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layers: any[] = widgets["a3lldg1wg9"].flexLayers;
      const result: FlexLayer[] = removeWidgetsFromCurrentLayers(
        ["33", "44"],
        layers,
      );
      expect(result[0].children.length).toEqual(2);
      expect(result).toEqual(layers);
    });
  });

  describe("test updateRelationships method", () => {
    const mainCanvasWidth = 960;
    it("should remove moved widgets from old parent's layers and assign new parent to the widgets", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const oldParent = widgets[movedWidget].parentId;
      const result: CanvasWidgetsReduxState = updateRelationships(
        [movedWidget],
        widgets,
        "0",
        false,
        false,
        mainCanvasWidth,
      );
      expect(result[movedWidget].parentId === "0").toBeTruthy;
      if (result[oldParent]) {
        expect(result[oldParent]?.children?.includes(movedWidget)).toBeFalsy;
        const layerIndex = getLayerIndexOfWidget(
          result[oldParent]?.flexLayers,
          "pt32jvs72k",
        );
        expect(layerIndex).toEqual(-1);
      }
    });
    it("should not update previous parent's children or moved widget's parentId id onlyUpdateFlexLayers is set to true", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const oldParent = widgets[movedWidget].parentId;
      const result: CanvasWidgetsReduxState = updateRelationships(
        [movedWidget],
        widgets,
        "0",
        true,
        false,
        mainCanvasWidth,
      );
      expect(result[movedWidget].parentId === "0").toBeFalsy;
      if (result[oldParent]) {
        expect(result[oldParent]?.children?.includes(movedWidget)).toBeTruthy;
        const layerIndex = getLayerIndexOfWidget(
          result[oldParent]?.flexLayers,
          "pt32jvs72k",
        );
        expect(layerIndex).toEqual(-1);
      }
    });
  });
  describe("test addNewLayer method", () => {
    it("should add a new layer to flexLayers array at the given layerIndex", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const newParentId = "0";
      const newLayer: FlexLayer = {
        children: [{ id: movedWidget, align: FlexLayerAlignment.Center }],
      };
      const result: CanvasWidgetsReduxState = addNewLayer(
        newLayer,
        widgets,
        newParentId,
        widgets[newParentId].flexLayers as FlexLayer[],
        0,
      );
      const updatedParent = result[newParentId];
      expect(updatedParent.flexLayers.length).toEqual(2);
      const layerIndex = getLayerIndexOfWidget(
        updatedParent?.flexLayers,
        "pt32jvs72k",
      );
      expect(layerIndex).toEqual(0);
    });
    it("should add new layer at the end of the flex layers if layerIndex is invalid", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const newParentId = "0";
      const newLayer: FlexLayer = {
        children: [{ id: movedWidget, align: FlexLayerAlignment.Center }],
      };
      const result: CanvasWidgetsReduxState = addNewLayer(
        newLayer,
        widgets,
        newParentId,
        widgets[newParentId].flexLayers as FlexLayer[],
        5,
      );
      const updatedParent = result[newParentId];
      expect(updatedParent.flexLayers.length).toEqual(2);
      const layerIndex = getLayerIndexOfWidget(
        updatedParent?.flexLayers,
        "pt32jvs72k",
      );
      expect(layerIndex).toEqual(1);
    });
  });

  describe("test updateExistingLayer method", () => {
    it("should update existing layer by merging the new layer at the given layerIndex", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const newParentId = "0";
      const newLayer: FlexLayer = {
        children: [{ id: movedWidget, align: FlexLayerAlignment.Center }],
      };
      const result: CanvasWidgetsReduxState = updateExistingLayer(
        newLayer,
        widgets,
        newParentId,
        widgets[newParentId].flexLayers as FlexLayer[],
        0,
        0,
      );
      const updatedParent = result[newParentId];
      expect(updatedParent.flexLayers.length).toEqual(1);
      expect(updatedParent.flexLayers[0].children.length).toEqual(3);
      const layerIndex = getLayerIndexOfWidget(
        updatedParent?.flexLayers,
        "pt32jvs72k",
      );
      expect(layerIndex).toEqual(0);
    });
  });
});
