import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { Category, Size } from "design-system";

const StyledPropertyPaneButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
`;

const MenuItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const OpenNextPannelButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

class OpenNextPanelWithButtonControl extends BaseControl<
  OpenNextPanelWithButtonControlProps
> {
  constructor(props: OpenNextPanelWithButtonControlProps) {
    super(props);
  }

  openConfigPanel = () => {
    const targetMenuItem = this.props.propertyValue;

    this.props.openNextPanel({
      index: 0,
      ...targetMenuItem,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const { buttonConfig, widgetProperties } = this.props;
    const { icon, label } = buttonConfig;
    const { widgetName } = widgetProperties;

    return (
      <MenuItemsWrapper>
        <StyledPropertyPaneButtonWrapper>
          <OpenNextPannelButton
            category={Category.tertiary}
            className={`t--${widgetName}-open-next-panel-button`}
            icon={icon}
            iconPosition="right"
            onClick={this.openConfigPanel}
            size={Size.medium}
            tag="button"
            text={label}
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </MenuItemsWrapper>
    );
  }

  static getControlType() {
    return "OPEN_NEXT_PANEL_WITH_BUTTON";
  }
}

export interface OpenNextPanelWithButtonControlProps extends ControlProps {
  buttonConfig: {
    icon: string;
    label: string;
  };
}

export default OpenNextPanelWithButtonControl;
