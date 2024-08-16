import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button, Input, Icon } from "@appsmith/ads";
import type { WidgetProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

interface ButtonControlState {
  showInput: boolean;
  eventName: string;
  pristine: boolean;
}

interface ButtonControlProps extends ControlProps {
  onAdd: (widget: WidgetProps, name: string) => Record<string, unknown>;
}

const StyledErrorMessage = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

// TODO (sbalaji1192): Find a better place to maintain this variable
const RESTRICTED_NAMES = [
  "onReset",
  "ENTITY_TYPE",
  "isVisible",
  "widgetName",
  "events",
  "defaultModel",
  "srcDoc",
  "uncompiledSrcDoc",
  "key",
  "isCanvas",
  "isSearchWildcard",
  "widgetId",
  "isLoading",
  "parentColumnSpace",
  "parentRowSpace",
  "leftColumn",
  "rightColumn",
  "topRow",
  "bottomRow",
  "mobileLeftColumn",
  "mobileRightColumn",
  "mobileTopRow",
  "mobileBottomRow",
  "model",
  "meta",
  "componentHeight",
  "componentWidth",
  "type",
  "__evaluation__",
];

class ButtonControl extends BaseControl<
  ButtonControlProps,
  ButtonControlState
> {
  state = {
    showInput: false,
    eventName: "",
    pristine: true,
  };

  reset = () => {
    this.setState({ showInput: false, eventName: "", pristine: true });
  };

  onCancel = () => {
    this.reset();
    AnalyticsUtil.logEvent("CUSTOM_WIDGET_ADD_EVENT_CANCEL_CLICKED", {
      widgetId: this.props.widgetProperties.widgetId,
    });
  };

  onSave = () => {
    const updates = this.props.onAdd(
      this.props.widgetProperties,
      this.state.eventName,
    );
    this.batchUpdateProperties(updates);
    this.reset();
    AnalyticsUtil.logEvent("CUSTOM_WIDGET_ADD_EVENT_SAVE_CLICKED", {
      widgetId: this.props.widgetProperties.widgetId,
    });
  };

  hasError = () => {
    return (
      !this.state.eventName.trim() ||
      this.props.widgetProperties.hasOwnProperty(this.state.eventName.trim()) ||
      this.props.widgetProperties.events.includes(
        this.state.eventName.trim(),
      ) ||
      RESTRICTED_NAMES.includes(this.state.eventName.trim())
    );
  };

  getErrorMessages = () => {
    let errorMessage = "";

    if (this.state.pristine) {
      return "";
    } else if (
      this.props.widgetProperties.hasOwnProperty(this.state.eventName.trim()) ||
      this.props.widgetProperties.events.includes(this.state.eventName.trim())
    ) {
      errorMessage = createMessage(
        CUSTOM_WIDGET_FEATURE.addEvent.errors.duplicate,
      );
    } else if (RESTRICTED_NAMES.includes(this.state.eventName.trim())) {
      errorMessage = createMessage(
        CUSTOM_WIDGET_FEATURE.addEvent.errors.restricted,
      );
    }

    return (
      errorMessage && (
        <StyledErrorMessage>
          <Icon name="alert-line" size="sm" />
          {errorMessage}
        </StyledErrorMessage>
      )
    );
  };

  render() {
    return (
      <div className={`mt-1 ${this.state.showInput ? "" : "flex justify-end"}`}>
        {this.state.showInput ? (
          <div>
            <div>
              <Input
                autoFocus
                errorMessage={this.getErrorMessages()}
                label={createMessage(CUSTOM_WIDGET_FEATURE.addEvent.nameLabel)}
                onChange={(value: string) => {
                  this.setState({ eventName: value.split(/\W+/).join("_") });
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  this.setState({ pristine: false });

                  if (e.key === "Enter" && !this.hasError()) {
                    this.onSave();
                  } else if (e.key === "Escape") {
                    this.onCancel();
                  }
                }}
                placeholder="Event Name"
                size="md"
                value={this.state.eventName}
              />
            </div>
            <div className="flex justify-end mt-4">
              <div className="pr-2">
                <Button kind="secondary" onClick={this.onCancel} size="sm">
                  {createMessage(CUSTOM_WIDGET_FEATURE.addEvent.cancelCTA)}
                </Button>
              </div>
              <div className="pl-2">
                <Button
                  isDisabled={this.hasError()}
                  kind="primary"
                  onClick={this.onSave}
                  size="sm"
                >
                  {createMessage(CUSTOM_WIDGET_FEATURE.addEvent.addCTA)}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            kind="tertiary"
            onClick={() => {
              this.setState({ showInput: true });
              AnalyticsUtil.logEvent("CUSTOM_WIDGET_ADD_EVENT_CLICKED", {
                widgetId: this.props.widgetProperties.widgetId,
              });
            }}
            size="sm"
            startIcon="plus"
          >
            {createMessage(CUSTOM_WIDGET_FEATURE.addEvent.addEventCTA)}
          </Button>
        )}
      </div>
    );
  }

  static getControlType() {
    return "CUSTOM_WIDGET_ADD_EVENT_BUTTON_CONTROL";
  }
}

export default ButtonControl;
