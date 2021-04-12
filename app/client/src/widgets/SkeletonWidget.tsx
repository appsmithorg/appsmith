import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

class SkeletonWidget extends BaseWidget<SkeletonWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [];
  }
  getPageView() {
    return <SkeletonWrapper className="bp3-skeleton" />;
  }

  static getWidgetType() {
    return "SKELETON_WIDGET";
  }
}

export const registerWidget = () => {
  WidgetFactory.registerWidgetBuilder(
    SkeletonWidget.getWidgetType(),
    {
      buildWidget(widgetData: SkeletonWidgetProps): JSX.Element {
        return <ProfiledSkeletonWidget {...widgetData} />;
      },
    },
    SkeletonWidget.getPropertyValidationMap(),
    SkeletonWidget.getDerivedPropertiesMap(),
    SkeletonWidget.getDefaultPropertiesMap(),
    SkeletonWidget.getMetaPropertiesMap(),
    SkeletonWidget.getPropertyPaneConfig(),
  );
};

export interface SkeletonWidgetProps extends WidgetProps {
  isLoading: boolean;
}

export default SkeletonWidget;
export const ProfiledSkeletonWidget = Sentry.withProfiler(SkeletonWidget);
