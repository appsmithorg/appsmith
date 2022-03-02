import * as React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import { boxShadowOptions } from "constants/ThemeConstants";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
import { ButtonTabComponent } from "components/ads";
export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps
> {
  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  public render() {
    return (
      <ButtonTabComponent
        options={Object.keys(boxShadowOptions).map((optionKey) => ({
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
                className="flex items-center justify-center w-5 h-5 bg-white"
                style={{ boxShadow: boxShadowOptions[optionKey] }}
              >
                {boxShadowOptions[optionKey] === "none" && (
                  <CloseLineIcon className="text-gray-700" />
                )}
              </div>
            </TooltipComponent>
          ),
          value: boxShadowOptions[optionKey],
        }))}
        selectButton={(value) => {
          this.updateProperty(this.props.propertyName, value);
        }}
        values={this.props.evaluatedValue ? [this.props.evaluatedValue] : []}
      />
    );
  }
}

export default BoxShadowOptionsControl;
