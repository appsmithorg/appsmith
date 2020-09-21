import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { FlexWrapper } from "./StyledControls";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
import { VerticalAlignment, VerticalAlignmentTypes } from "widgets/TableWidget";

const ItemWrapper = styled.div<{ selected: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => (props.selected ? "#29CCA3" : "#21282C")};
  cursor: pointer;
  &:first-of-type {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  &:last-of-type {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

class VerticalAlignmentControl extends BaseControl<ControlProps> {
  selectAlignment = (verticalAlignment: VerticalAlignment) => {
    const propertyValue: VerticalAlignment = this.props.propertyValue;
    if (propertyValue === verticalAlignment) {
      this.updateProperty(
        this.props.propertyName,
        VerticalAlignmentTypes.CENTER,
      );
    } else {
      this.updateProperty(this.props.propertyName, verticalAlignment);
    }
  };
  render() {
    const propertyValue: VerticalAlignment = this.props.propertyValue;
    return (
      <FlexWrapper>
        <ItemWrapper
          selected={propertyValue === VerticalAlignmentTypes.TOP}
          onClick={() => this.selectAlignment(VerticalAlignmentTypes.TOP)}
        >
          <ControlIcons.VERTICAL_TOP
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
        <ItemWrapper
          selected={propertyValue === VerticalAlignmentTypes.CENTER}
          onClick={() => this.selectAlignment(VerticalAlignmentTypes.CENTER)}
        >
          <ControlIcons.VERTICAL_CENTER
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
        <ItemWrapper
          selected={propertyValue === VerticalAlignmentTypes.BOTTOM}
          onClick={() => this.selectAlignment(VerticalAlignmentTypes.BOTTOM)}
        >
          <ControlIcons.VERTICAL_BOTTOM
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
      </FlexWrapper>
    );
  }

  static getControlType() {
    return "VERTICAL_ALIGNMENT";
  }
}

export default VerticalAlignmentControl;
