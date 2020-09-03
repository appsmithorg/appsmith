import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import styled from "styled-components";
import IconComponent, {
  IconType,
} from "components/designSystems/appsmith/IconComponent";
import { EventType, ExecutionResult } from "constants/ActionConstants";
import * as Sentry from "@sentry/react";

const IconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
class IconWidget extends BaseWidget<IconWidgetProps, WidgetState> {
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onClick: true,
    };
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-function */
  handleActionResult = (result: ExecutionResult) => {};

  onClick = () => {
    if (this.props.onClick) {
      super.executeAction({
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
          iconName={this.props.iconName}
          disabled={this.props.disabled}
          iconSize={this.props.iconSize}
          color={this.props.color}
          onClick={this.onClick}
        />
      </IconWrapper>
    );
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.ICON_WIDGET;
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
export const ProfiledIconWidget = Sentry.withProfiler(IconWidget);
