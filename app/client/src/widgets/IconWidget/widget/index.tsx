import type { WidgetCallout } from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { buildDeprecationWidgetMessage } from "pages/Editor/utils";
import React from "react";
import styled from "styled-components";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import type { IconType } from "../component";
import IconComponent from "../component";
import IconSVG from "../icon.svg";

const IconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
class IconWidget extends BaseWidget<IconWidgetProps, WidgetState> {
  static type = "ICON_WIDGET";

  static getConfig() {
    return {
      name: "Icon",
      iconSVG: IconSVG,
      hideCard: true,
      isDeprecated: true,
      replacement: "ICON_BUTTON_WIDGET",
      tags: [WIDGET_TAGS.BUTTONS],
    };
  }

  static getDefaults() {
    return {
      widgetName: "Icon",
      rows: 4,
      columns: 4,
      version: 1,
    };
  }

  static getMethods() {
    return {
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message: buildDeprecationWidgetMessage(IconWidget.getConfig().name),
          },
        ];
      },
    };
  }

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  getWidgetView() {
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
}

export const IconSizes: { [key: string]: number } = {
  LARGE: 32,
  SMALL: 12,
  DEFAULT: 16,
};

export type IconSize = (typeof IconSizes)[keyof typeof IconSizes] | undefined;

export interface IconWidgetProps extends WidgetProps {
  iconName: IconType;
  onClick: string;
  iconSize: IconSize;
  color: string;
}

export default IconWidget;
