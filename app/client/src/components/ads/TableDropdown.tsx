import React, { useCallback, useState } from "react";
import { CommonComponentProps, hexToRgba } from "./common";
import { ReactComponent as DownArrow } from "assets/icons/ads/down_arrow.svg";
import Text, { TextType } from "./Text";
import styled from "styled-components";

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  onSelect: (selectedValue: string) => void;
  selectedOption: DropdownOption;
};

const DropdownWrapper = styled.div`
  width: 100%;
  position: relative;
`;

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
  position: absolute;
  margin-top: ${props => props.theme.spaces[8]}px;
  left: -60px;
  width: 200px;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.blackShades[3]};
  box-shadow: ${props => props.theme.spaces[0]}px
    ${props => props.theme.spaces[5]}px ${props => props.theme.spaces[13] - 2}px
    ${props => hexToRgba(props.theme.colors.blackShades[0], 0.75)};
`;

const DropdownOption = styled.div<{
  selected: DropdownOption;
  option: DropdownOption;
}>`
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  cursor: pointer;
  background-color: ${props =>
    props.option.label === props.selected.label
      ? props.theme.colors.blackShades[4]
      : "transparent"};

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
  const [selected, setSelected] = useState(props.selectedOption);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownHandler = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const optionSelector = (option: DropdownOption) => {
    setSelected(option);
    setIsDropdownOpen(false);
  };

  return (
    <DropdownWrapper>
      <SelectedItem onClick={() => dropdownHandler()}>
        <Text type={TextType.P1}>{selected.label}</Text>
        <DownArrow />
      </SelectedItem>
      {isDropdownOpen ? (
        <OptionsWrapper>
          {props.options.map((el: DropdownOption, index: number) => (
            <DropdownOption
              key={index}
              selected={selected}
              option={el}
              onClick={() => optionSelector(el)}
            >
              <Text type={TextType.H5}>{el.label}</Text>
              <Text type={TextType.P3}>{el.value}</Text>
            </DropdownOption>
          ))}
        </OptionsWrapper>
      ) : null}
    </DropdownWrapper>
  );
};

export default TableDropdown;
