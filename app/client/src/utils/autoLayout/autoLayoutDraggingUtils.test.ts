import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  createFlexLayer,
  removeWidgetsFromCurrentLayers,
  updateRelationships,
} from "./autoLayoutDraggingUtils";
import { FlexLayerAlignment } from "./constants";
import { data } from "./testData";

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
      const layers: any[] = widgets["a3lldg1wg9"].flexLayers;
      const result: FlexLayer[] = removeWidgetsFromCurrentLayers(
        ["pt32jvs72k"],
        layers,
      );
      const layerIndex = result.findIndex((layer: FlexLayer) => {
        return (
          layer.children.findIndex(
            (child: LayerChild) => child.id === "pt32jvs72k",
          ) !== -1
        );
      });
      expect(result[0].children.length).toEqual(1);
      expect(layerIndex).toEqual(-1);
    });
    it("should return an empty array if the input layers are empty", () => {
      expect(removeWidgetsFromCurrentLayers(["pt32jvs72k"], [])).toEqual([]);
    });
    it("should return input flexLayers as is if moved widgets are not found amongst them", () => {
      const widgets = { ...data };
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
    it("should remove moved widgets from old parent's layers and assign new parent to the widgets", () => {
      const widgets = { ...data };
      const movedWidget = "pt32jvs72k";
      const oldParent = widgets[movedWidget].parentId;
      const result: CanvasWidgetsReduxState = updateRelationships(
        [movedWidget],
        widgets,
        "0",
      );
      expect(result[movedWidget].parentId === "0").toBeTruthy;
      if (result[oldParent]) {
        expect(result[oldParent]?.children?.includes(movedWidget)).toBeFalsy;
        const layerIndex = result[oldParent]?.flexLayers?.findIndex(
          (layer: FlexLayer) => {
            return (
              layer.children.findIndex(
                (child: LayerChild) => child.id === "pt32jvs72k",
              ) !== -1
            );
          },
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
      );
      expect(result[movedWidget].parentId === "0").toBeFalsy;
      if (result[oldParent]) {
        expect(result[oldParent]?.children?.includes(movedWidget)).toBeTruthy;
        const layerIndex = result[oldParent]?.flexLayers?.findIndex(
          (layer: FlexLayer) => {
            return (
              layer.children.findIndex(
                (child: LayerChild) => child.id === "pt32jvs72k",
              ) !== -1
            );
          },
        );
        expect(layerIndex).toEqual(-1);
      }
    });
  });
});
