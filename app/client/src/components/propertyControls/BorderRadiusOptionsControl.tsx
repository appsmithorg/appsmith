import * as React from "react";
import { tw } from "twind";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import store from "store";
import { getSelectedAppThemeProperties } from "selectors/appThemingSelectors";
import {
  getThemePropertyBinding,
  borderRadiusPropertyName,
  borderRadiusOptions,
} from "constants/ThemeContants";

export interface BorderRadiusOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

interface BorderRadiusOptionsControlState {
  themeBorderOptions: Record<string, string>;
}

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
  ) => {
    return (
      <TooltipComponent content={optionKey} key={optionKey}>
        <button
          className={`flex items-center justify-center w-8 h-8 bg-trueGray-100 ring-primary-500 cursor-pointer hover:bg-trueGray-50 ${
            this.props.propertyValue === optionValue ? "ring-1" : ""
          }`}
          onClick={() => {
            this.updateProperty(this.props.propertyName, optionValue);
          }}
        >
          <div
            className={`${tw`rounded-tl-[${twSuffix}]`} w-4 h-4 border-t-2 border-l-2 rounded- border-gray-600`}
          />
        </button>
      </TooltipComponent>
    );
  };

  public render() {
    return (
      <div className="mt-2 mb-2">
        <div className="inline-flex">
          <div className="pr-2 mr-2 border-r">
            {Object.keys(this.state.themeBorderOptions).map((optionKey) =>
              this.renderOptions(
                optionKey,
                getThemePropertyBinding(
                  `${borderRadiusPropertyName}.${optionKey}`,
                ),
                this.state.themeBorderOptions[optionKey],
              ),
            )}
          </div>
          <div className="grid grid-cols-6 gap-2 auto-cols-max">
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
