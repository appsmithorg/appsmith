import type { ButtonBorderRadius } from "components/constants";
import Skeleton from "components/utils/Skeleton";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import React, { lazy, Suspense } from "react";
import type ReactPlayer from "react-player";
import { retryPromise } from "utils/AppsmithUtils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type {
  SnipingModeProperty,
  PropertyUpdates,
} from "WidgetProvider/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

const VideoComponent = lazy(async () =>
  retryPromise(async () => import("../component")),
);

export enum PlayState {
  NOT_STARTED = "NOT_STARTED",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  PLAYING = "PLAYING",
}

class VideoWidget extends BaseWidget<VideoWidgetProps, WidgetState> {
  static type = "VIDEO_WIDGET";

  static getConfig() {
    return {
      name: "Video",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.MEDIA],
      needsMeta: true,
      searchTags: ["youtube"],
    };
  }

  static getDefaults() {
    return {
      rows: 28,
      columns: 24,
      widgetName: "Video",
      url: getAssetUrl(`${ASSETS_CDN_URL}/widgets/bird.mp4`),
      autoPlay: false,
      version: 1,
      animateLoading: true,
      backgroundColor: "#000",
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "url",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

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
                regex:
                  /^(http(s)?:\/\/)?([-a-zA-Z0-9:%._\+~#=]*@)?(([-a-zA-Z0-9\.]{2,256}\.[a-z]{2,6})|(?:\d{1,3}\.){3}\d{1,3}\b)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
                expected: {
                  type: "Video URL",
                  example: getAssetUrl(`${ASSETS_CDN_URL}/widgets/bird.mp4`),
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
            label: "Animate loading",
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
            helpText: "when the video is played",
            propertyName: "onPlay",
            label: "onPlay",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the video is paused",
            propertyName: "onPause",
            label: "onPause",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the video ends",
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

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setURL: {
          path: "url",
          type: "string",
        },
        setPlaying: {
          path: "autoPlay",
          type: "boolean",
          accessor: "playState",
        },
      },
    };
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
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
            label: "Box shadow",
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Video widget can be used for playing a variety of URLs, including file paths, YouTube, Facebook, Twitch, SoundCloud, Streamable, Vimeo, Wistia, Mixcloud, and DailyMotion.",
      "!url": "https://docs.appsmith.com/widget-reference/video",
      playState: "number",
      autoPlay: "bool",
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

  getWidgetView() {
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
