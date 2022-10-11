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

const ConfigureMenuItemButton = styled(StyledPropertyPaneButton)`
  justify-content: center;
  flex-grow: 1;
`;

class ConfigureMenuItemsControl extends BaseControl<ControlProps> {
  constructor(props: ControlProps) {
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
    return (
      <MenuItemsWrapper>
        <StyledPropertyPaneButtonWrapper>
          <ConfigureMenuItemButton
            category={Category.tertiary}
            className="t--add-menu-item-btn"
            icon="settings-2-line"
            iconPosition="right"
            onClick={this.openConfigPanel}
            size={Size.medium}
            tag="button"
            text="Array Item"
            type="button"
          />
        </StyledPropertyPaneButtonWrapper>
      </MenuItemsWrapper>
    );
  }

  static getControlType() {
    return "CONFIGURE_MENU_ITEMS";
  }
}

export default ConfigureMenuItemsControl;
