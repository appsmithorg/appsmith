import type { FlattenedWidgetProps } from "widgets/constants";
import type { FlexLayerAlignment } from "./constants";

export type AlignmentColumnInfo = {
  [key in FlexLayerAlignment]: number;
};

export type FlexBoxAlignmentColumnInfo = {
  [key: number]: AlignmentColumnInfo;
};

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
}

export interface DropZone {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex: number; // index of layer in props.flexLayers.
  rowIndex: number; // index of highlight within a horizontal layer.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
  isVertical: boolean; // determines if the highlight is vertical or horizontal.
  canvasId: string; // widgetId of the canvas to which the highlight belongs.
  dropZone: DropZone; // size of the drop zone of this highlight.
}

/**
 * Start: Position utils types
 */

export interface AlignmentChildren {
  widget: FlattenedWidgetProps;
  columns: number;
  rows: number;
}

export interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: AlignmentChildren[];
}

export interface Row extends AlignmentInfo {
  height: number;
}

/**
 * End: Position utils types
 */
