import * as React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import { boxShadowOptions } from "constants/ThemeConstants";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps
> {
  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  renderOptions = (optionKey: string, optionValue: string) => {
    return (
      <TooltipComponent
        content={
          <div>
            <div>{optionKey}</div>
          </div>
        }
        key={optionKey}
      >
        <button
          className={`flex items-center justify-center w-8 h-8 bg-white border ring-gray-700 ${
            this.props.evaluatedValue === optionValue ? "ring-1" : ""
          }`}
          onClick={() => {
            this.updateProperty(this.props.propertyName, optionValue);
          }}
        >
          <div
            className="flex items-center justify-center w-5 h-5 bg-white"
            style={{ boxShadow: optionValue }}
          >
            {optionValue === "none" && (
              <CloseLineIcon className="text-gray-700" />
            )}
          </div>
        </button>
      </TooltipComponent>
    );
  };

  public render() {
    return (
      <div className="mt-1">
        <div className="inline-flex">
          <div className="grid grid-cols-5 gap-2 auto-cols-max">
            {Object.keys(boxShadowOptions).map((optionKey) =>
              this.renderOptions(optionKey, boxShadowOptions[optionKey]),
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default BoxShadowOptionsControl;
