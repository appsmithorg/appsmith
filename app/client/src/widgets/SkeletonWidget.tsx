import type { AnvilConfig } from "WidgetProvider/constants";
import React from "react";
import styled from "styled-components";
import type { WidgetProps, WidgetState } from "./BaseWidget";
import BaseWidget from "./BaseWidget";

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

class SkeletonWidget extends BaseWidget<SkeletonWidgetProps, WidgetState> {
  static type = "SKELETON_WIDGET";

  static getConfig() {
    return {
      name: "Skeleton",
      hideCard: true,
    };
  }

  static getDefaults() {
    return {
      isLoading: true,
      rows: 4,
      columns: 4,
      widgetName: "Skeleton",
      version: 1,
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {};
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        minHeight: { base: "auto" },
        minWidth: { base: "auto" },
      },
    };
  }

  static getPropertyPaneConfig() {
    return [];
  }
  getWidgetView() {
    return <SkeletonWrapper className="bp3-skeleton" />;
  }
}

export interface SkeletonWidgetProps extends WidgetProps {
  isLoading: boolean;
}

export default SkeletonWidget;
