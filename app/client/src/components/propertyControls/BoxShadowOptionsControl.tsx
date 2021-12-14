import * as React from "react";
import { tw, css } from "twind/css";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import { getSelectedAppThemeProperties } from "selectors/appThemingSelectors";
import store from "store";
import {
  boxShadowOptions,
  boxShadowPropertyName,
  getThemePropertyBinding,
} from "constants/ThemeContants";
export interface BoxShadowOptionsControlProps extends ControlProps {
  propertyValue: string | undefined;
}

interface BoxShadowOptionsControlState {
  themeBoxShadowOptions: Record<string, string>;
}

class BoxShadowOptionsControl extends BaseControl<
  BoxShadowOptionsControlProps,
  BoxShadowOptionsControlState
> {
  constructor(props: BoxShadowOptionsControlProps) {
    super(props);
    this.state = {
      themeBoxShadowOptions: {},
    };
  }

  static getControlType() {
    return "BOX_SHADOW_OPTIONS";
  }

  componentDidMount() {
    const theme = getSelectedAppThemeProperties(store.getState());

    if (Object.keys(theme[boxShadowPropertyName]).length) {
      this.setState({
        themeBoxShadowOptions: theme[boxShadowPropertyName],
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
          className={`flex items-center justify-center w-8 h-8 bg-white border ring-primary-400 ${
            this.props.propertyValue === optionValue ? "ring-1" : ""
          }`}
          onClick={() => {
            this.updateProperty(this.props.propertyName, optionValue);
          }}
        >
          <div
            className={`flex items-center  justify-center w-5 h-5 bg-white ${tw`${css(
              {
                "&": {
                  boxShadow: twSuffix,
                },
              },
            )}`}`}
          />
        </button>
      </TooltipComponent>
    );
  };

  public render() {
    return (
      <div className="mt-2 mb-2">
        <div className="mb-2">Theme:</div>
        <div className="grid grid-flow-col gap-2 auto-cols-max">
          {Object.keys(this.state.themeBoxShadowOptions).map((optionKey) =>
            this.renderOptions(
              optionKey,
              getThemePropertyBinding(`${boxShadowPropertyName}.${optionKey}`),
              this.state.themeBoxShadowOptions[optionKey],
            ),
          )}
        </div>
        <div className="mb-2 mt-3">Options:</div>
        <div className="grid grid-flow-col gap-2 auto-cols-max">
          {Object.keys(boxShadowOptions).map((optionKey) =>
            this.renderOptions(
              optionKey,
              boxShadowOptions[optionKey],
              boxShadowOptions[optionKey],
            ),
          )}
        </div>
      </div>
    );
  }
}

export default BoxShadowOptionsControl;
