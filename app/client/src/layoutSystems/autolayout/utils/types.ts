import type { FlexLayerAlignment } from "layoutSystems/anvil/utils/constants";

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
}
