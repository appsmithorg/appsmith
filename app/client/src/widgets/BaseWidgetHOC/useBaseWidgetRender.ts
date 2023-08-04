import type { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getAppPositioningType } from "selectors/editorSelectors";
import { withAutoLayoutSystem } from "./render/layoutSystems/AutoLayout/withAutoLayoutSystem";
import { withFixedLayoutSystem } from "./render/layoutSystems/FixedLayout/withFixedLayoutSystem";

export const useBaseWidgetRender = (renderMode: RenderModes) => {
  const appPositioningType = useSelector(getAppPositioningType);
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return withAutoLayoutSystem(renderMode);
  } else {
    return withFixedLayoutSystem(renderMode);
  }
};
