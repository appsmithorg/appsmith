import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { HighlightPayload, HighlightRenderInfo } from "./anvilTypes";
import { anvilWidgets } from "ee/modules/ui-builder/ui/wds/constants";

export const MOBILE_BREAKPOINT = 480;

export const HIGHLIGHT_SIZE = 2;
export const PADDING_FOR_HORIZONTAL_HIGHLIGHT = 2;
export const DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT = 60;
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
  height: 0,
  isVertical: false,
  posX: 0,
  posY: 0,
  width: 0,
  edgeDetails: {
    bottom: false,
    left: false,
    right: false,
    top: false,
  },
};

// Constants for the minimum and maximum zone count
export const MIN_ZONE_COUNT = 1;
export const MAX_ZONE_COUNT = 4;

export const SELECT_ANVIL_WIDGET_CUSTOM_EVENT =
  "SELECT_ANVIL_WIDGET_CUSTOM_EVENT";

export const widgetHierarchy: Record<string, number> = {
  MAIN_CANVAS: 0,
  WDS_MODAL_WIDGET: 1,
  [anvilWidgets.SECTION_WIDGET]: 2,
  [anvilWidgets.ZONE_WIDGET]: 3,
  OTHER: 4,
};
