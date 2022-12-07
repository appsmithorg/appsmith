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

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const OpenNextPannelButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

class OpenConfigPanelControl extends BaseControl<OpenConfigPanelControlProps> {
  constructor(props: OpenConfigPanelControlProps) {
    super(props);
  }

  openConfigPanel = () => {
    this.props.openNextPanel({
      index: 0,
      ...this.props.propertyValue,
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const { buttonConfig, widgetProperties } = this.props;
    const { icon, label } = buttonConfig;
    const { widgetName } = widgetProperties;

    return (
      <Wrapper>
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
      </Wrapper>
    );
  }

  static getControlType() {
    return "OPEN_CONFIG_PANEL";
  }
}

export interface OpenConfigPanelControlProps extends ControlProps {
  buttonConfig: {
    icon: string;
    label: string;
  };
}

export default OpenConfigPanelControl;
