import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

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
