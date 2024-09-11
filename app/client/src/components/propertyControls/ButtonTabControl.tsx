import React from "react";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ToggleGroupOption } from "@appsmith/ads";
import { ToggleButtonGroup } from "@appsmith/ads";
import produce from "immer";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

export interface ButtonTabControlProps extends ControlProps {
  options: ToggleGroupOption[];
  defaultValue: string;
}

class ButtonTabControl extends BaseControl<ButtonTabControlProps> {
  componentRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.componentRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.componentRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "ButtonGroup" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  selectButton = (value: string, isUpdatedViaKeyboard = false) => {
    const { defaultValue, propertyValue } = this.props;
    const values: string[] = propertyValue
      ? propertyValue.split(",")
      : defaultValue
        ? defaultValue.split(",")
        : [];

    if (values.includes(value)) {
      values.splice(values.indexOf(value), 1);

      this.updateProperty(
        this.props.propertyName,
        values.join(","),
        isUpdatedViaKeyboard,
      );
    } else {
      const updatedValues: string[] = produce(values, (draft: string[]) => {
        draft.push(value);
      });

      this.updateProperty(
        this.props.propertyName,
        updatedValues.join(","),
        isUpdatedViaKeyboard,
      );
    }
  };

  render() {
    return (
      <ToggleButtonGroup
        onClick={this.selectButton}
        options={this.props.options}
        ref={this.componentRef}
        values={
          this.props.propertyValue ? this.props.propertyValue.split(",") : []
        }
      />
    );
  }

  static getControlType() {
    return "BUTTON_GROUP";
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    const allowedValues = new Set(
      (config as ButtonTabControlProps)?.options?.map(
        (x: { value: string }) => x.value,
      ),
    );

    const values = value.split(",");

    for (const x of values) {
      if (!allowedValues.has(x)) return false;
    }

    return true;
  }
}

export default ButtonTabControl;
