import React, { Suspense, lazy } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { RenderModes } from "constants/WidgetConstants";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import moment from "moment";
import { isString, isNumber, isUndefined } from "lodash";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import VideoComponent from "components/designSystems/appsmith/VideoComponent";

// const ReactTableComponent = lazy(() =>
//     retryPromise(() =>
//         import("components/designSystems/appsmith/VideoComponent"),
//     ),
// );

class VideoWidget extends BaseWidget<VideoWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      url: VALIDATION_TYPES.TEXT,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      // onRowSelected: true,
      // onPageChange: true,
      // onSearchTextChanged: true,
      // columnActions: true,
    };
  }

  shouldComponentUpdate(nextProps: VideoWidgetProps) {
    return nextProps.url !== this.props.url;
  }

  getPageView() {
    const { url } = this.props;
    console.log({ url });
    return (
      <Suspense fallback={<Skeleton />}>
        {<VideoComponent url={url}></VideoComponent>}
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return "VIDEO_WIDGET";
  }
}

export interface VideoWidgetProps extends WidgetProps {
  url: string;
}

export default VideoWidget;
export const ProfiledVideoWidget = Sentry.withProfiler(VideoWidget);
