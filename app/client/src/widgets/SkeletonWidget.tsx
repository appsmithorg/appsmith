import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import styled from "styled-components";
import { GRID_DENSITY_MIGRATION_V1 } from "./constants";

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

export const CONFIG = {
  type: SkeletonWidget.getWidgetType(),
  name: "Skeleton",
  hideCard: true,
  defaults: {
    isLoading: true,
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 1 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Skeleton",
    version: 1,
  },
  properties: {
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
