import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getAppPositioningType } from "selectors/editorSelectors";
import { useAutoLayoutSystem } from "./render/layoutSystems/AutoLayout/useAutoLayoutSystem";
import { useFixedLayoutSystem } from "./render/layoutSystems/FixedLayout/useFixedLayoutSystem";
import type { BaseWidgetProps } from "./withBaseWidget";

export const useBaseWidgetRender = (): ((
  Widget: (widgetData: any) => JSX.Element,
  props: BaseWidgetProps,
) => JSX.Element) => {
  const appPositioningType = useSelector(getAppPositioningType);
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return useAutoLayoutSystem();
  } else {
    return useFixedLayoutSystem();
  }
};
