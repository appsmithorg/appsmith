import * as React from "react";

import TooltipComponent from "components/ads/Tooltip";
import BaseControl, { ControlProps } from "./BaseControl";
import { borderRadiusOptions } from "constants/ThemeConstants";
import classNames from "classnames";

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

  renderOptions = (
    optionKey: string,
    optionValue: string,
    twSuffix: string,
    isThemeValue?: boolean,
  ) => {
    return (
      <TooltipComponent
        content={
          <div>
            {isThemeValue && (
              <header className="text-xs text-center text-gray-300 uppercase">
                Theme
              </header>
            )}
            <div>{optionKey}</div>
          </div>
        }
        key={optionKey}
      >
        <button
          className={classNames({
            "flex items-center justify-center w-8 h-8 bg-white ring-1 cursor-pointer hover:bg-trueGray-50": true,
            "ring-gray-800": this.props.evaluatedValue === optionValue,
            "ring-gray-300": this.props.evaluatedValue !== optionValue,
          })}
          onClick={() => {
            this.updateProperty(this.props.propertyName, optionValue);
          }}
        >
          <div
            className={classNames({
              "w-5 h-5 border-t-2 border-l-2": true,
              "border-gray-800": this.props.evaluatedValue === optionValue,
              "border-gray-500": this.props.evaluatedValue !== optionValue,
            })}
            style={{ borderTopLeftRadius: twSuffix }}
          />
        </button>
      </TooltipComponent>
    );
  };

  public render() {
    return (
      <div className="mt-1">
        <div className="inline-flex">
          <div className="grid grid-cols-5 gap-2 auto-cols-max">
            {Object.keys(borderRadiusOptions).map((optionKey) =>
              this.renderOptions(
                optionKey,
                borderRadiusOptions[optionKey],
                borderRadiusOptions[optionKey],
              ),
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default BorderRadiusOptionsControl;
