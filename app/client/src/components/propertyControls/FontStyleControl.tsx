import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { FlexWrapper } from "./StyledControls";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
import { FontStyle, FontStyleTypes } from "widgets/TableWidget";

const ItemWrapper = styled.div<{ selected: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => (props.selected ? "#29CCA3" : "#21282C")};
  border-radius: 4px;
  cursor: pointer;
  &:first-of-type {
    margin-right: 4px;
  }
`;

class FontStyleControl extends BaseControl<ControlProps> {
  selectFontType = (fontStyle: FontStyle) => {
    const propertyValue: FontStyle = this.props.propertyValue;
    if (propertyValue === fontStyle) {
      this.updateProperty(this.props.propertyName, FontStyleTypes.NORMAL);
    } else {
      this.updateProperty(this.props.propertyName, fontStyle);
    }
  };
  render() {
    const propertyValue: FontStyle = this.props.propertyValue;
    return (
      <FlexWrapper>
        <ItemWrapper
          selected={propertyValue === FontStyleTypes.BOLD}
          onClick={() => this.selectFontType(FontStyleTypes.BOLD)}
        >
          <ControlIcons.BOLD_FONT color={Colors.WHITE} width={24} height={24} />
        </ItemWrapper>
        <ItemWrapper
          selected={propertyValue === FontStyleTypes.ITALIC}
          onClick={() => this.selectFontType(FontStyleTypes.ITALIC)}
        >
          <ControlIcons.ITALICS_FONT
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
      </FlexWrapper>
    );
  }

  static getControlType() {
    return "FONT_STYLE";
  }
}

export default FontStyleControl;
