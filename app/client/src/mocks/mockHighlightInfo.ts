import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { HighlightInfo } from "layoutSystems/common/utils/types";

export function mockHighlightInfo(
  data: Partial<HighlightInfo> = {},
): HighlightInfo {
  return {
    alignment: FlexLayerAlignment.Start,
    canvasId: "",
    dropZone: {},
    height: 40,
    isNewLayer: false,
    index: 0,
    isVertical: true,
    layerIndex: 0,
    rowIndex: 0,
    posX: 0,
    posY: 0,
    width: 4,
    ...data,
  };
}
