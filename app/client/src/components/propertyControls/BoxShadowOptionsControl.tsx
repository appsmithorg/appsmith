import * as React from "react";
import { tw, css } from "twind/css";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";

// list of box shadow options
const options: { [key: string]: string } = {
  none: "none",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps
> {
  constructor(props: BoxShadowOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <div className="grid grid-flow-col gap-2 auto-cols-max">
        {Object.keys(options).map((optionKey) => (
          <TooltipComponent content={optionKey} key={optionKey}>
            <button
              className={`flex items-center justify-center w-8 h-8 bg-white border ring-primary-400 ${
                propertyValue === options[optionKey] ? "ring-1" : ""
              }`}
              onClick={() => {
                this.updateProperty(
                  this.props.propertyName,
                  options[optionKey],
                );
              }}
            >
              <div
                className={`flex items-center  justify-center w-5 h-5 bg-white ${tw`${css(
                  {
                    "&": {
                      boxShadow: options[optionKey],
                    },
                  },
                )}`}`}
              />
            </button>
          </TooltipComponent>
        ))}
      </div>
    );
  }
}

export default BoxShadowOptionsControl;
