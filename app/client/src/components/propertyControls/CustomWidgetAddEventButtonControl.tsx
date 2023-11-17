import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button, Input } from "design-system";
import type { WidgetProps } from "widgets/BaseWidget";

interface ButtonControlState {
  showInput: boolean;
  eventName: string;
  pristine: boolean;
}

interface ButtonControlProps extends ControlProps {
  onAdd: (widget: WidgetProps, name: string) => Record<string, unknown>;
}

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
  };

  onSave = () => {
    const updates = this.props.onAdd(
      this.props.widgetProperties,
      this.state.eventName,
    );
    this.batchUpdateProperties(updates);
    this.reset();
  };

  hasError = () => {
    return (
      !this.state.eventName.trim() ||
      this.props.widgetProperties.hasOwnProperty(this.state.eventName.trim()) ||
      this.props.widgetProperties.events.includes(this.state.eventName.trim())
    );
  };

  getErrorMessages = () => {
    if (this.state.pristine) {
      return "";
    } else if (this.state.eventName.trim() === "") {
      return "Event name cannot be empty";
    } else if (
      this.props.widgetProperties.hasOwnProperty(this.state.eventName.trim()) ||
      this.props.widgetProperties.events.includes(this.state.eventName.trim())
    ) {
      return "Event name already exists";
    }
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
                label="Name"
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
                  Cancel
                </Button>
              </div>
              <div className="pl-2">
                <Button
                  isDisabled={this.hasError()}
                  kind="primary"
                  onClick={this.onSave}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            kind="tertiary"
            onClick={() => this.setState({ showInput: true })}
            size="sm"
            startIcon="plus"
          >
            Add Event
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
