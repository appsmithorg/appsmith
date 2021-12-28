import * as React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import store from "store";
import { getSelectedAppThemeProperties } from "selectors/appThemingSelectors";
import {
  getThemePropertyBinding,
  borderRadiusPropertyName,
  borderRadiusOptions,
} from "constants/ThemeContants";
import { startCase } from "lodash";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
export interface BorderRadiusOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

interface BorderRadiusOptionsControlState {
  themeBorderOptions: Record<string, string>;
}

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
class BorderRadiusOptionsControl extends BaseControl<
  BorderRadiusOptionsControlProps,
  BorderRadiusOptionsControlState
> {
  constructor(props: BorderRadiusOptionsControlProps) {
    super(props);
    this.state = {
      themeBorderOptions: {},
    };
  }

  static getControlType() {
    return "BORDER_RADIUS_OPTIONS";
  }

  componentDidMount() {
    const theme = getSelectedAppThemeProperties(store.getState());

    if (Object.keys(theme[borderRadiusPropertyName]).length) {
      this.setState({
        themeBorderOptions: theme[borderRadiusPropertyName],
      });
    }
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
            <div>{startCase(optionKey)}</div>
          </div>
        }
        key={optionKey}
      >
        <button
          className={`flex items-center justify-center w-8 h-8 bg-trueGray-100 ring-gray-700 cursor-pointer hover:bg-trueGray-50 ${
            this.props.evaluatedValue === optionValue ? "ring-1" : ""
          }`}
          onClick={() => {
            this.updateProperty(this.props.propertyName, optionValue);
          }}
        >
          <div
            className="w-4 h-4 border-t-2 border-l-2 border-gray-600 rounded-"
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
