import React, { Suspense, lazy } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import ReactPlayer from "react-player";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

const AudioComponent = lazy(() => retryPromise(() => import("../component")));

export enum PlayState {
  NOT_STARTED = "NOT_STARTED",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  PLAYING = "PLAYING",
}

class AudioWidget extends BaseWidget<AudioWidgetProps, WidgetState> {
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
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
                expected: {
                  type: "Audio URL",
                  example:
                    "https://cdn.simplecast.com/audio/10488ddf-3ca4-4300-9391-c2967d806334/episodes/8c8341f0-0a3a-4f2c-bfe0-0abb6b3c1c87/audio/03e2e3d8-e703-4953-adc0-e72687f31178/default_tc.mp3",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
          {
            propertyName: "autoPlay",
            label: "Auto Play",
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
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the audio is played",
            propertyName: "onPlay",
            label: "onPlay",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the audio is paused",
            propertyName: "onPause",
            label: "onPause",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the audio ends",
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

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      playState: PlayState.NOT_STARTED,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  getPageView() {
    const { autoPlay, onEnd, onPause, onPlay, url } = this.props;
    return (
      <Suspense fallback={<Skeleton />}>
        <AudioComponent
          autoplay={autoPlay}
          controls
          onEnded={() => {
            this.props.updateWidgetMetaProperty("playState", PlayState.ENDED, {
              triggerPropertyName: "onEnd",
              dynamicString: onEnd,
              event: {
                type: EventType.ON_AUDIO_END,
              },
            });
          }}
          onPause={() => {
            //TODO: We do not want the pause event for onSeek or onEnd.
            this.props.updateWidgetMetaProperty("playState", PlayState.PAUSED, {
              triggerPropertyName: "onPause",
              dynamicString: onPause,
              event: {
                type: EventType.ON_AUDIO_PAUSE,
              },
            });
          }}
          onPlay={() => {
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
          }}
          player={this._player}
          url={url}
        />
      </Suspense>
    );
  }

  static getWidgetType(): WidgetType {
    return "AUDIO_WIDGET";
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
