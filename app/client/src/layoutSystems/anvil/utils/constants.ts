import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { HighlightPayload, HighlightRenderInfo } from "./anvilTypes";

export const MOBILE_BREAKPOINT = 480;

export const HIGHLIGHT_SIZE = 4;
export const INFINITE_DROP_ZONE = 100;
export const VERTICAL_DROP_ZONE_MULTIPLIER = 0.5;
export const HORIZONTAL_DROP_ZONE_MULTIPLIER = 0.35;

export const AlignmentIndexMap: { [key: string]: number } = {
  [FlexLayerAlignment.Start]: 0,
  [FlexLayerAlignment.Center]: 1,
  [FlexLayerAlignment.End]: 2,
};

export const defaultHighlightPayload: HighlightPayload = {
  highlights: [],
  skipEntity: false,
};

export const defaultHighlightRenderInfo: HighlightRenderInfo = {
  dropZone: {},
  height: 0,
  isVertical: false,
  posX: 0,
  posY: 0,
  width: 0,
};

// Constants for the minimum and maximum zone count
export const MIN_ZONE_COUNT = 1;
export const MAX_ZONE_COUNT = 4;
