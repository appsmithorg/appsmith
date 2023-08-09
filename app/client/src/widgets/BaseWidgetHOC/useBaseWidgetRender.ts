import type { RenderModes } from "constants/WidgetConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { withAutoLayoutSystem } from "./render/layoutSystems/AutoLayout/withAutoLayoutSystem";
import { withFixedLayoutSystem } from "./render/layoutSystems/FixedLayout/withFixedLayoutSystem";

export const useBaseWidgetRender = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
) => {
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return withAutoLayoutSystem(renderMode);
  } else {
    return withFixedLayoutSystem(renderMode);
  }
};
