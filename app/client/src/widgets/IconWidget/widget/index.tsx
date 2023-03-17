import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import styled from "styled-components";
import IconComponent, { IconType } from "../component";
import {
  EventType,
  ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

const IconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
class IconWidget extends BaseWidget<IconWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-function */
  handleActionResult = (result: ExecutionResult) => {};

  onClick = () => {
    if (this.props.onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionResult,
        },
      });
    }
  };

  getPageView() {
    return (
      <IconWrapper>
        <IconComponent
          color={this.props.color}
          disabled={this.props.disabled}
          iconName={this.props.iconName}
          iconSize={this.props.iconSize}
          onClick={this.onClick}
        />
      </IconWrapper>
    );
  }

  static getWidgetType(): string {
    return "ICON_WIDGET";
  }
}

export const IconSizes: { [key: string]: number } = {
  LARGE: 32,
  SMALL: 12,
  DEFAULT: 16,
};

export type IconSize = typeof IconSizes[keyof typeof IconSizes] | undefined;

export interface IconWidgetProps extends WidgetProps {
  iconName: IconType;
  onClick: string;
  iconSize: IconSize;
  color: string;
}

export default IconWidget;
