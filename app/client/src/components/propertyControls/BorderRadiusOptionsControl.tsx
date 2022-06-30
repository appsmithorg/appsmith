import * as React from "react";

import { TooltipComponent } from "design-system";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { borderRadiusOptions } from "constants/ThemeConstants";
import { ButtonTabComponent } from "components/ads";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
export interface BorderRadiusOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

const options = Object.keys(borderRadiusOptions).map((optionKey) => ({
  icon: (
    <TooltipComponent
      content={
        <div>
          <div>{optionKey}</div>
        </div>
      }
      key={optionKey}
      openOnTargetFocus={false}
    >
      <button tabIndex={-1}>
        <div
          className="w-5 h-5 border-t-2 border-l-2 border-gray-500"
          style={{ borderTopLeftRadius: borderRadiusOptions[optionKey] }}
        />
      </button>
    </TooltipComponent>
  ),
  value: borderRadiusOptions[optionKey],
}));

const optionsValues = new Set(Object.values(borderRadiusOptions));

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
class BorderRadiusOptionsControl extends BaseControl<
  BorderRadiusOptionsControlProps
> {
  static getControlType() {
    return "BORDER_RADIUS_OPTIONS";
  }

  public render() {
    return (
      <ButtonTabComponent
        options={options}
        selectButton={(value) => {
          this.updateProperty(this.props.propertyName, value);
        }}
        values={this.props.evaluatedValue ? [this.props.evaluatedValue] : []}
      />
    );
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return optionsValues.has(value);
  }
}

export default BorderRadiusOptionsControl;
