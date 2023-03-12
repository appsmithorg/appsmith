import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import { Button } from "design-system";

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
          <Button
            className={`t--${widgetName}-open-next-panel-button`}
            endIcon={icon}
            kind="secondary"
            onPress={this.openConfigPanel}
            size="md"
          >
            {label}
          </Button>
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
