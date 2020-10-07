import React, { Suspense, lazy } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import ReactPlayer from "react-player";

const VideoComponent = lazy(() =>
  retryPromise(() =>
    import("components/designSystems/appsmith/VideoComponent"),
  ),
);

export enum PlayState {
  NOT_STARTED = "NOT_STARTED",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  PLAYING = "PLAYING",
}

class VideoWidget extends BaseWidget<VideoWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "url",
            label: "URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter url",
            inputType: "TEXT",
          },
          {
            propertyName: "autoPlay",
            label: "Auto Play",
            helpText: "Video will be automatically played",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the video is played",
            propertyName: "onPlay",
            label: "onPlay",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
          {
            helpText: "Triggers an action when the video is paused",
            propertyName: "onPause",
            label: "onPause",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
          {
            helpText: "Triggers an action when the video ends",
            propertyName: "onEnd",
            label: "onEnd",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
        ],
      },
    ];
  }
  private _player = React.createRef<ReactPlayer>();
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      url: VALIDATION_TYPES.TEXT,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      playState: PlayState.NOT_STARTED,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onEnd: true,
      onPlay: true,
      onPause: true,
    };
  }

  shouldComponentUpdate(nextProps: VideoWidgetProps) {
    return nextProps.url !== this.props.url;
  }

  getPageView() {
    const { url, autoPlay, onEnd, onPause, onPlay } = this.props;
    return (
      <Suspense fallback={<Skeleton />}>
        <VideoComponent
          player={this._player}
          url={url}
          autoplay={autoPlay}
          controls={true}
          onPlay={() => {
            this.updateWidgetMetaProperty("playState", PlayState.PLAYING);
            if (onPlay) {
              super.executeAction({
                dynamicString: onPlay,
                event: {
                  type: EventType.ON_VIDEO_PLAY,
                },
              });
            }
          }}
          onPause={() => {
            //TODO: We do not want the pause event for onSeek or onEnd.
            this.updateWidgetMetaProperty("playState", PlayState.PAUSED);
            if (onPause) {
              super.executeAction({
                dynamicString: onPause,
                event: {
                  type: EventType.ON_VIDEO_PAUSE,
                },
              });
            }
          }}
          onEnded={() => {
            this.updateWidgetMetaProperty("playState", PlayState.ENDED);
            if (onEnd) {
              super.executeAction({
                dynamicString: onEnd,
                event: {
                  type: EventType.ON_VIDEO_END,
                },
              });
            }
          }}
        />
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return "VIDEO_WIDGET";
  }
}

export interface VideoWidgetProps extends WidgetProps {
  url: string;
  autoPlay: boolean;
  onPause?: string;
  onPlay?: string;
  onEnd?: string;
}

export default VideoWidget;
export const ProfiledVideoWidget = Sentry.withProfiler(VideoWidget);
