import React from "react";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ButtonGroupOption } from "design-system-old";
import { ButtonGroup } from "design-system-old";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

class IconTabControl extends BaseControl<IconTabControlProps> {
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

  selectOption = (value: string, isUpdatedViaKeyboard = false) => {
    const { defaultValue, propertyValue } = this.props;
    if (propertyValue === value) {
      this.updateProperty(
        this.props.propertyName,
        defaultValue,
        isUpdatedViaKeyboard,
      );
    } else {
      this.updateProperty(this.props.propertyName, value, isUpdatedViaKeyboard);
    }
  };
  render() {
    const { fullWidth, options, propertyValue } = this.props;
    return (
      <ButtonGroup
        fullWidth={fullWidth}
        options={options}
        ref={this.componentRef}
        selectButton={this.selectOption}
        values={[propertyValue]}
      />
    );
  }

  static getControlType() {
    return "ICON_TABS";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    if (
      (config as IconTabControlProps)?.options
        ?.map((x: { value: string }) => x.value)
        .includes(value)
    )
      return true;
    return false;
  }
}

export interface IconTabControlProps extends ControlProps {
  options: ButtonGroupOption[];
  defaultValue: string;
  fullWidth: boolean;
}

export default IconTabControl;
