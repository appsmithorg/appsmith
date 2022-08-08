import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { ButtonTab, ButtonTabOption } from "design-system";
import produce from "immer";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

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
      e.detail.component === "ButtonTab" &&
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
    const { options, propertyValue } = this.props;
    return (
      <ButtonTab
        options={options}
        ref={this.componentRef}
        selectButton={this.selectButton}
        values={propertyValue ? propertyValue.split(",") : []}
      />
    );
  }

  static getControlType() {
    return "BUTTON_TABS";
  }

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

export interface ButtonTabControlProps extends ControlProps {
  options: ButtonTabOption[];
  defaultValue: string;
}

export default ButtonTabControl;
