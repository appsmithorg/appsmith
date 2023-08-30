import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystemWrapper } from "./autolayout";
import { getFixedLayoutSystemWrapper } from "./fixedlayout";

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

const LayoutSystemWrapper = (props: WidgetProps) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  const LayoutSystem: any = getLayoutSystem(renderMode, appPositioningType);
  return <LayoutSystem {...props} />;
};

export const withLayoutSystemHOC = (Widget: any) => {
  return function LayoutWrappedWidget(props: WidgetProps) {
    return (
      <LayoutSystemWrapper {...props}>
        <Widget {...props} />
      </LayoutSystemWrapper>
    );
  };
};
