import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystemWrapper } from "./AutoLayout/AutoLayoutSystemWrapper";
import { getFixedLayoutSystemWrapper } from "./FixedLayout/FixedLayoutSystemWrapper";

const getLayoutSystem = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
) => {
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return getAutoLayoutSystemWrapper(renderMode);
  } else {
    return getFixedLayoutSystemWrapper(renderMode);
  }
};

export const LayoutSystemWrapper = (props: WidgetProps) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  const LayoutSystem: any = getLayoutSystem(renderMode, appPositioningType);
  return <LayoutSystem {...props} />;
};
