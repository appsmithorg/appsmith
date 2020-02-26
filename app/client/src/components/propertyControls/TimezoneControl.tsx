import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledTimeZonePicker } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import moment from "moment-timezone";
import "../../../node_modules/@blueprintjs/timezone/lib/css/blueprint-timezone.css";

class TimeZoneControl extends BaseControl<TimeZoneControlProps> {
  render() {
    return (
      <StyledTimeZonePicker
        onChange={this.onTimeZoneSelected}
        valueDisplayFormat={"composite"}
        showLocalTimezone={true}
        value={this.props.propertyValue || moment.tz.guess()}
      />
    );
  }

  onTimeZoneSelected = (timezone: string): void => {
    this.updateProperty(this.props.propertyName, timezone);
  };

  getControlType(): ControlType {
    return "TIME_ZONE";
  }
}

export interface TimeZoneControlProps extends ControlProps {
  propertyValue: string;
}

export default TimeZoneControl;
