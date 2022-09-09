import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
// import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";
import { ActionCreator } from "components/editorComponents/ActionCreator";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

class ActionSelectorControl extends BaseControl<ControlProps> {
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
      e.detail.component === "TreeDropdown" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.componentRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  handleValueUpdate = (newValue: string, isUpdatedViaKeyboard = false) => {
    const { propertyName } = this.props;
    this.updateProperty(propertyName, newValue, isUpdatedViaKeyboard);
  };

  render() {
    const { propertyValue } = this.props;

    return (
      <ActionCreator
        additionalAutoComplete={this.props.additionalAutoComplete}
        onValueChange={this.handleValueUpdate}
        ref={this.componentRef}
        value={propertyValue}
      />
    );
  }

  static getControlType() {
    return "ACTION_SELECTOR";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return true;
  }
}

export default ActionSelectorControl;
