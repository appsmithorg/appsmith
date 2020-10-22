import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import styled from "styled-components";

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

class SkeletonWidget extends BaseWidget<SkeletonWidgetProps, WidgetState> {
  getPageView() {
    return <SkeletonWrapper className="bp3-skeleton" />;
  }

  getWidgetType(): WidgetType {
    return "SKELETON_WIDGET";
  }
}

export interface SkeletonWidgetProps extends WidgetProps {
  isLoading: boolean;
}

export default SkeletonWidget;
export const ProfiledSkeletonWidget = Sentry.withProfiler(SkeletonWidget);
