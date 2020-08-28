import React, { useCallback, useState } from "react";
import { CommonComponentProps, hexToRgba } from "./common";
import { ReactComponent as DownArrow } from "assets/icons/ads/down_arrow.svg";
import Text, { TextType } from "./Text";
import styled from "styled-components";
import {
  Popover,
  PopoverInteractionKind,
} from "@blueprintjs/core/lib/esm/components/popover/popover";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

type DropdownOption = {
  name: string;
  desc: string;
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  onSelect: (selectedValue: DropdownOption) => void;
  selectedIndex: number;
  position?: Position;
};

const SelectedItem = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;

  span {
    margin-right: ${props => props.theme.spaces[1] + 1}px;
  }
`;

const OptionsWrapper = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.blackShades[3]};
  box-shadow: ${props => props.theme.spaces[0]}px
    ${props => props.theme.spaces[5]}px ${props => props.theme.spaces[13] - 2}px
    ${props => hexToRgba(props.theme.colors.blackShades[0], 0.75)};
`;

const DropdownOption = styled.div<{
  isSelected: boolean;
}>`
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  cursor: pointer;
  ${props =>
    props.isSelected
      ? `background-color: ${props.theme.colors.blackShades[4]}`
      : null};

  span:last-child {
    margin-top: ${props => props.theme.spaces[1] + 1}px;
  }

  &:hover {
    span {
      color: ${props => props.theme.colors.blackShades[9]};
    }
  }
`;

const TableDropdown = (props: DropdownProps) => {
  const [selectedIndex, setSelectedIndex] = useState(props.selectedIndex);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    props.options[props.selectedIndex] || {},
  );

  const optionSelector = (index: number) => {
    setSelectedIndex(index);
    setSelectedOption(props.options[index]);
    props.onSelect && props.onSelect(props.options[index]);
    setIsDropdownOpen(false);
  };

  return (
    <Popover
      usePortal={false}
      position={props.position || Position.BOTTOM_LEFT}
      isOpen={isDropdownOpen}
      onInteraction={state => setIsDropdownOpen(state)}
      interactionKind={PopoverInteractionKind.CLICK}
    >
      <SelectedItem>
        <Text type={TextType.P1}>{selectedOption.name}</Text>
        <DownArrow />
      </SelectedItem>
      <OptionsWrapper>
        {props.options.map((el: DropdownOption, index: number) => (
          <DropdownOption
            key={index}
            isSelected={selectedIndex === index}
            onClick={() => optionSelector(index)}
          >
            <Text type={TextType.H5}>{el.name}</Text>
            <Text type={TextType.P3}>{el.desc}</Text>
          </DropdownOption>
        ))}
      </OptionsWrapper>
    </Popover>
  );
};

export default TableDropdown;
