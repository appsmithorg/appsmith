import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export const MOBILE_BREAKPOINT = 480;

export const AlignmentIndexMap: { [key: string]: number } = {
  [FlexLayerAlignment.Start]: 0,
  [FlexLayerAlignment.Center]: 1,
  [FlexLayerAlignment.End]: 2,
};
