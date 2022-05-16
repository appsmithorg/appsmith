import * as React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import { boxShadowOptions } from "constants/ThemeConstants";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
import { ButtonTabComponent } from "components/ads";
export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

const options = Object.keys(boxShadowOptions).map((optionKey) => ({
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
      <button>
        <div
          className="flex items-center justify-center w-5 h-5 bg-white"
          style={{ boxShadow: boxShadowOptions[optionKey] }}
        >
          {boxShadowOptions[optionKey] === "none" && (
            <CloseLineIcon className="text-gray-700" />
          )}
        </div>
      </button>
    </TooltipComponent>
  ),
  value: boxShadowOptions[optionKey],
}));

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps
> {
  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
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
}

export default BoxShadowOptionsControl;
