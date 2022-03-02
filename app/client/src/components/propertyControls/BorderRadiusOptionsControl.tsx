import * as React from "react";

import TooltipComponent from "components/ads/Tooltip";
import BaseControl, { ControlProps } from "./BaseControl";
import { borderRadiusOptions } from "constants/ThemeConstants";
import classNames from "classnames";
import { ButtonTabComponent } from "components/ads";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
export interface BorderRadiusOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}
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
        options={Object.keys(borderRadiusOptions).map((optionKey) => ({
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
              <div
                className={classNames({
                  "w-5 h-5 border-t-2 border-l-2": true,
                  "border-gray-800":
                    this.props.evaluatedValue ===
                    borderRadiusOptions[optionKey],
                  "border-gray-500":
                    this.props.evaluatedValue !==
                    borderRadiusOptions[optionKey],
                })}
                style={{ borderTopLeftRadius: borderRadiusOptions[optionKey] }}
              />
            </TooltipComponent>
          ),
          value: borderRadiusOptions[optionKey],
        }))}
        selectButton={(value) => {
          this.updateProperty(this.props.propertyName, value);
        }}
        values={this.props.evaluatedValue ? [this.props.evaluatedValue] : []}
      />
    );
  }
}

export default BorderRadiusOptionsControl;
