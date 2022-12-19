import React, { Suspense, lazy } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import ReactPlayer from "react-player";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { ButtonBorderRadius } from "components/constants";
import { Stylesheet } from "entities/AppTheming";

const VideoComponent = lazy(() => retryPromise(() => import("../component")));

export enum PlayState {
  NOT_STARTED = "NOT_STARTED",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  PLAYING = "PLAYING",
}

class VideoWidget extends BaseWidget<VideoWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "url",
            label: "URL",
            helpText: "Link to the video file which should be played",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
                expected: {
                  type: "Video URL",
                  example: "https://assets.appsmith.com/widgets/bird.mp4",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "autoPlay",
            label: "Autoplay",
            helpText:
              "Video will be automatically played, by enabling this feature, video will be muted by default.",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the video is played",
            propertyName: "onPlay",
            label: "onPlay",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video is paused",
            propertyName: "onPause",
            label: "onPause",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video ends",
            propertyName: "onEnd",
            label: "onEnd",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  private _player = React.createRef<ReactPlayer>();

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      // Property reflecting the state of the widget
      playState: PlayState.NOT_STARTED,
      // Property passed onto the video player making it a controlled component
      playing: false,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      playing: "autoPlay",
    };
  }

  // TODO: (Rishabh) When we have the new list widget, we need to make the playState as a derived propery.
  // TODO: (Balaji) Can we have dynamic default value that accepts current widget values and determines the default value.
  componentDidUpdate(prevProps: VideoWidgetProps) {
    // When the widget is reset
    if (
      prevProps.playState !== "NOT_STARTED" &&
      this.props.playState === "NOT_STARTED"
    ) {
      this._player.current?.seekTo(0);

      if (this.props.playing) {
        this.props.updateWidgetMetaProperty("playState", PlayState.PLAYING);
      }
    }

    // When autoPlay changes from property pane
    if (prevProps.autoPlay !== this.props.autoPlay) {
      if (this.props.autoPlay) {
        this.props.updateWidgetMetaProperty("playState", PlayState.PLAYING);
      } else {
        this.props.updateWidgetMetaProperty("playState", PlayState.PAUSED);
      }
    }
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  getPageView() {
    const { autoPlay, onEnd, onPause, onPlay, playing, url } = this.props;
    return (
      <Suspense fallback={<Skeleton />}>
        <VideoComponent
          autoPlay={autoPlay}
          backgroundColor={this.props.backgroundColor}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          boxShadowColor={this.props.boxShadowColor}
          controls
          onEnded={() => {
            // Stopping the video from playing when the media is finished playing
            this.props.updateWidgetMetaProperty("playing", false);
            this.props.updateWidgetMetaProperty("playState", PlayState.ENDED, {
              triggerPropertyName: "onEnd",
              dynamicString: onEnd,
              event: {
                type: EventType.ON_VIDEO_END,
              },
            });
          }}
          onPause={() => {
            // TODO: We do not want the pause event for onSeek or onEnd.
            // Stopping the media when it is playing and pause is hit
            if (this.props.playing) {
              this.props.updateWidgetMetaProperty("playing", false);
              this.props.updateWidgetMetaProperty(
                "playState",
                PlayState.PAUSED,
                {
                  triggerPropertyName: "onPause",
                  dynamicString: onPause,
                  event: {
                    type: EventType.ON_VIDEO_PAUSE,
                  },
                },
              );
            }
          }}
          onPlay={() => {
            // Playing the media when it is stopped / paused and play is hit
            if (!this.props.playing) {
              this.props.updateWidgetMetaProperty("playing", true);
              this.props.updateWidgetMetaProperty(
                "playState",
                PlayState.PLAYING,
                {
                  triggerPropertyName: "onPlay",
                  dynamicString: onPlay,
                  event: {
                    type: EventType.ON_VIDEO_PLAY,
                  },
                },
              );
            }
          }}
          player={this._player}
          playing={playing}
          url={url}
        />
      </Suspense>
    );
  }

  static getWidgetType(): WidgetType {
    return "VIDEO_WIDGET";
  }
}

export interface VideoWidgetProps extends WidgetProps {
  url: string;
  autoPlay: boolean;
  onPause?: string;
  onPlay?: string;
  onEnd?: string;
  backgroundColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: string;
}

export default VideoWidget;
