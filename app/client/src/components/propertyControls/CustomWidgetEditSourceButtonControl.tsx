import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button, Icon } from "design-system";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "pages/Editor/CustomWidgetBuilder/contants";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

interface ButtonControlState {
  isSourceEditorOpen: boolean;
  sourceEditor?: Window;
}

class ButtonControl extends BaseControl<ControlProps, ButtonControlState> {
  state: ButtonControlState = {
    isSourceEditorOpen: false,
  };

  onCTAClick = () => {
    const builderUrl = window.location.pathname + "/builder";

    if (
      this.state.isSourceEditorOpen &&
      !this.state.sourceEditor?.closed &&
      this.state.sourceEditor
    ) {
      this.state.sourceEditor.focus();
    } else {
      const editSourceWindow = window.open(builderUrl, "_blank");

      if (editSourceWindow) {
        this.setState({
          isSourceEditorOpen: true,
          sourceEditor: editSourceWindow,
        });

        editSourceWindow?.addEventListener("message", (event: any) => {
          if (event.source === editSourceWindow) {
            switch (event.data.type) {
              case CUSTOM_WIDGET_BUILDER_EVENTS.READY:
                editSourceWindow.postMessage({
                  type: CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK,
                  name: this.props.widgetProperties.widgetName,
                  srcDoc: this.props.widgetProperties.srcDoc,
                  uncompiledSrcDoc:
                    this.props.widgetProperties.uncompiledSrcDoc,
                  model:
                    this.props.widgetProperties.__evaluation__?.evaluatedValues
                      .defaultModel,
                  events: this.props.widgetProperties.events.reduce(
                    (prev: Record<string, string>, curr: string) => {
                      prev[curr] = this.props.widgetProperties[curr];

                      return prev;
                    },
                    {},
                  ),
                });
                break;
              case CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC:
                this.props.onBatchUpdateProperties?.({
                  srcDoc: event.data.srcDoc,
                  uncompiledSrcDoc: event.data.uncompiledSrcDoc,
                });

                editSourceWindow.postMessage({
                  type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC_ACK,
                  success: true,
                });
                break;
              case CUSTOM_WIDGET_BUILDER_EVENTS.DISCONNECTED:
                this.setState({
                  isSourceEditorOpen: false,
                  sourceEditor: undefined,
                });
                break;
            }
          }
        });
      }
    }
  };

  beforeWindowUnload = () => {
    if (
      this.state.sourceEditor &&
      !this.state.sourceEditor.closed &&
      this.state.isSourceEditorOpen
    ) {
      this.state.sourceEditor.close();
    }
  };

  componentDidMount(): void {
    window.addEventListener("beforeunload", this.beforeWindowUnload);
  }

  componentWillUnmount(): void {
    this.beforeWindowUnload();
    window.removeEventListener("beforeunload", this.beforeWindowUnload);
  }

  componentDidUpdate(prevProps: Readonly<ControlProps>): void {
    const hasEventChanged =
      this.props.widgetProperties.events.length !==
        prevProps.widgetProperties.events.length ||
      this.props.widgetProperties.events.some((event: string) => {
        return (
          prevProps.widgetProperties[event] !==
          this.props.widgetProperties[event]
        );
      });

    if (
      this.state.isSourceEditorOpen &&
      (prevProps.widgetProperties.widgetName !==
        this.props.widgetProperties.widgetName ||
        hasEventChanged ||
        prevProps.widgetProperties.__evaluation__?.evaluatedValues
          .defaultModel !==
          this.props.widgetProperties.__evaluation__?.evaluatedValues
            .defaultModel)
    ) {
      this.state.sourceEditor?.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERENCES,
          name: this.props.widgetProperties.widgetName,
          model:
            this.props.widgetProperties.__evaluation__?.evaluatedValues
              .defaultModel,
          events: this.props.widgetProperties.events.reduce(
            (prev: Record<string, string>, curr: string) => {
              prev[curr] = this.props.widgetProperties[curr];

              return prev;
            },
            {},
          ),
        },
        "*",
      );
    }
  }

  render() {
    return (
      <Button
        kind="secondary"
        onClick={this.onCTAClick}
        size="md"
        style={{
          width: "100%",
        }}
      >
        {this.state.isSourceEditorOpen
          ? createMessage(CUSTOM_WIDGET_FEATURE.editSource.goToSourceCTA)
          : createMessage(CUSTOM_WIDGET_FEATURE.editSource.editSourceCTA)}
        &nbsp;
        <Icon name="share-box-line" size="sm" />
      </Button>
    );
  }

  static getControlType() {
    return "CUSTOM_WIDGET_EDIT_BUTTON_CONTROL";
  }
}

export default ButtonControl;
