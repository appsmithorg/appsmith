import Skeleton from "components/utils/Skeleton";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
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
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import type { SetterConfig } from "entities/AppTheming";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

const AudioComponent = lazy(async () =>
  retryPromise(async () => import("../component")),
);

export enum PlayState {
  NOT_STARTED = "NOT_STARTED",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  PLAYING = "PLAYING",
}

class AudioWidget extends BaseWidget<AudioWidgetProps, WidgetState> {
  static type = "AUDIO_WIDGET";

  static getConfig() {
    return {
      name: "Audio",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.MEDIA],
      needsMeta: true,
      searchTags: ["mp3", "sound", "wave", "player"],
    };
  }

  static getDefaults() {
    return {
      rows: 4,
      columns: 28,
      widgetName: "Audio",
      url: getAssetUrl(`${ASSETS_CDN_URL}/widgets/birds_chirping.mp3`),
      autoPlay: false,
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "180px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "40px" },
        minWidth: { base: "180px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Audio widget can be used for playing a variety of audio formats like MP3, AAC etc.",
      "!url": "https://docs.appsmith.com/widget-reference/audio",
      playState: "number",
      autoPlay: "bool",
    };
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

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "url",
            label: "URL",
            helpText: "Link to the audio file which should be played",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter url",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex:
                  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
                expected: {
                  type: "Audio URL",
                  example: getAssetUrl(
                    `${ASSETS_CDN_URL}/widgets/birds_chirping.mp3`,
                  ),
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
            helpText: "Audio will be automatically played",
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
            helpText: "when the audio is played",
            propertyName: "onPlay",
            label: "onPlay",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the audio is paused",
            propertyName: "onPause",
            label: "onPause",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the audio ends",
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

  private _player = React.createRef<ReactPlayer>();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      // Property reflecting the state of the widget
      playState: PlayState.NOT_STARTED,
      // Property passed onto the audio player making it a controlled component
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
  componentDidUpdate(prevProps: AudioWidgetProps) {
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

  getWidgetView() {
    const { onEnd, onPause, onPlay, playing, url } = this.props;
    return (
      <Suspense fallback={<Skeleton />}>
        <AudioComponent
          controls
          onEnded={() => {
            // Stopping the audio from playing when the media is finished playing
            this.props.updateWidgetMetaProperty("playing", false);
            this.props.updateWidgetMetaProperty("playState", PlayState.ENDED, {
              triggerPropertyName: "onEnd",
              dynamicString: onEnd,
              event: {
                type: EventType.ON_AUDIO_END,
              },
            });
          }}
          onPause={() => {
            // TODO: We do not want the pause event for onSeek or onEnd.
            // Don't set playState to paused on onEnded
            if (
              this._player.current &&
              this._player.current.getDuration() ===
                this._player.current.getCurrentTime()
            ) {
              return;
            }
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
                    type: EventType.ON_AUDIO_PAUSE,
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
                    type: EventType.ON_AUDIO_PLAY,
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

export interface AudioWidgetProps extends WidgetProps {
  url: string;
  autoPlay: boolean;
  onPause?: string;
  onPlay?: string;
  onEnd?: string;
}

export default AudioWidget;
