import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import styled from "styled-components";

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

class SkeletonWidget extends BaseWidget<SkeletonWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [];
  }
  render() {
    return <SkeletonWrapper className="bp3-skeleton" />;
  }

  static getWidgetType() {
    return "SKELETON_WIDGET";
  }
}

export const CONFIG = {
  type: SkeletonWidget.getWidgetType(),
  name: "Skeleton",
  iconSVG: "",
  hideCard: true,
  defaults: {
    rows: 1,
    columns: 1,
    widgetName: "Skeleton",
  },
  properties: {
    validations: SkeletonWidget.getPropertyValidationMap(),
    derived: SkeletonWidget.getDerivedPropertiesMap(),
    default: SkeletonWidget.getDefaultPropertiesMap(),
    meta: SkeletonWidget.getMetaPropertiesMap(),
    config: SkeletonWidget.getPropertyPaneConfig(),
  },
};

export interface SkeletonWidgetProps extends WidgetProps {
  isLoading: boolean;
}

export default SkeletonWidget;
