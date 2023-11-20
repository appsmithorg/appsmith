import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button } from "design-system";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "pages/Editor/CustomWidgetBuilder/contants";

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
      this.state.sourceEditor.location.href = builderUrl;
    } else {
      const editSourceWindow = window.open(builderUrl, "_blank");

      if (editSourceWindow) {
        this.setState({
          isSourceEditorOpen: true,
          sourceEditor: editSourceWindow,
        });

        editSourceWindow?.addEventListener("message", (event: any) => {
          if (event.origin === window.location.origin) {
            switch (event.data.type) {
              case CUSTOM_WIDGET_BUILDER_EVENTS.READY:
                editSourceWindow.postMessage({
                  type: CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK,
                  name: this.props.widgetProperties.widgetName,
                  srcDoc: this.props.widgetProperties.srcDoc,
                  model:
                    this.props.widgetProperties.__evaluation__.evaluatedValues
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
                });

                editSourceWindow.postMessage({
                  type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC_ACK,
                  success: true,
                });
                break;
            }
          }
        });
      }
    }
  };

  componentDidUpdate(prevProps: Readonly<ControlProps>): void {
    const hasEventChanged = this.props.widgetProperties.events.some(
      (event: string) => {
        return (
          prevProps.widgetProperties[event] !==
          this.props.widgetProperties[event]
        );
      },
    );

    if (
      hasEventChanged ||
      prevProps.widgetProperties.events.length !==
        this.props.widgetProperties.events.length ||
      prevProps.widgetProperties.__evaluation__.evaluatedValues.defaultModel !==
        this.props.widgetProperties.__evaluation__.evaluatedValues.defaultModel
    ) {
      this.state.sourceEditor?.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERRENCES,
          model:
            this.props.widgetProperties.__evaluation__.evaluatedValues
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
        Edit Source
      </Button>
    );
  }

  static getControlType() {
    return "CUSTOM_WIDGET_EDIT_BUTTON_CONTROL";
  }
}

export default ButtonControl;
