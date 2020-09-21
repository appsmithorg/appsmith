import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { FlexWrapper } from "./StyledControls";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
import { CellAlignment, CellAlignmentTypes } from "widgets/TableWidget";

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

class TextAlignmentControl extends BaseControl<ControlProps> {
  selectAlignmentType = (textAlignment: CellAlignment) => {
    const propertyValue: CellAlignment = this.props.propertyValue;
    if (propertyValue === textAlignment) {
      this.updateProperty(this.props.propertyName, CellAlignmentTypes.LEFT);
    } else {
      this.updateProperty(this.props.propertyName, textAlignment);
    }
  };
  render() {
    const propertyValue: CellAlignment = this.props.propertyValue;
    return (
      <FlexWrapper>
        <ItemWrapper
          selected={propertyValue === CellAlignmentTypes.LEFT}
          onClick={() => this.selectAlignmentType(CellAlignmentTypes.LEFT)}
        >
          <ControlIcons.LEFT_ALIGN
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
        <ItemWrapper
          selected={propertyValue === CellAlignmentTypes.CENTER}
          onClick={() => this.selectAlignmentType(CellAlignmentTypes.CENTER)}
        >
          <ControlIcons.CENTER_ALIGN
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
        <ItemWrapper
          selected={propertyValue === CellAlignmentTypes.RIGHT}
          onClick={() => this.selectAlignmentType(CellAlignmentTypes.RIGHT)}
        >
          <ControlIcons.RIGHT_ALIGN
            color={Colors.WHITE}
            width={24}
            height={24}
          />
        </ItemWrapper>
      </FlexWrapper>
    );
  }

  static getControlType() {
    return "TEXT_ALIGNMENT";
  }
}

export default TextAlignmentControl;
