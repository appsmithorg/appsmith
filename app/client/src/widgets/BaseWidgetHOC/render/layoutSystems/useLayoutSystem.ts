import type { RenderModes } from "constants/WidgetConstants";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import { withAutoLayoutSystem } from "./AutoLayout/withAutoLayoutSystem";
import { withFixedLayoutSystem } from "./FixedLayout/withFixedLayoutSystem";

const getLayoutSystemHOC = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
) => {
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return withAutoLayoutSystem(renderMode);
  } else {
    return withFixedLayoutSystem(renderMode);
  }
};

export const useLayoutSystem = () => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  return useMemo(
    () => getLayoutSystemHOC(renderMode, appPositioningType),
    [renderMode, appPositioningType],
  );
};
