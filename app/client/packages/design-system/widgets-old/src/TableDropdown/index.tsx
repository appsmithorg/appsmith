import { Position } from "@blueprintjs/core/lib/esm/common/position";
import {
  Popover,
  PopoverInteractionKind,
} from "@blueprintjs/core/lib/esm/components/popover/popover";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "../Icon";
import Spinner from "../Spinner";
import Text, { TextType } from "../Text";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";

export interface TableDropdownOption {
  id: string;
  name: string;
  desc: string;
}

type DropdownProps = CommonComponentProps & {
  options: TableDropdownOption[];
  onSelect: (selectedValue: TableDropdownOption) => void;
  selectedIndex: number;
  position?: Position;
  selectedTextWidth?: string;
};

const SelectedItem = styled.div<{
  width?: string;
}>`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  .${Classes.TEXT} {
    margin-right: calc(var(--ads-spaces-1) + 1px);
    width: ${(props) => props.width || "auto"};
  }
`;

const OptionsWrapper = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  background-color: var(--ads-table-dropdown-background-color);
  box-shadow: var(--ads-spaces-0) var(--ads-spaces-5)
    calc(var(--ads-spaces-13) - 2px) rgba(0, 0, 0, 0.32);
`;

const DropdownOption = styled.div<{
  isSelected: boolean;
}>`
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  cursor: pointer;
  ${(props) =>
    props.isSelected
      ? `background-color: var(--ads-table-dropdown-selected-background-color)`
      : null};

  .${Classes.TEXT}:last-child {
    margin-top: calc(var(--ads-spaces-1) + 1px);
  }

  &:hover {
    .${Classes.TEXT} {
      color: var(--ads-table-dropdown-selected-hover-text-color);
    }
  }
`;

const Content = styled.div<{ isLoading?: boolean }>`
  position: relative;

  & .${Classes.SPINNER} {
    position: absolute;
  }

  & .selected-item {
    ${(props) => (props.isLoading ? `visibility: hidden;` : null)}
  }
`;

function TableDropdown(props: DropdownProps) {
  const { onSelect } = props;
  const [selectedIndex, setSelectedIndex] = useState(props.selectedIndex);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    props.options[props.selectedIndex] || {},
  );

  useEffect(() => {
    if (props.selectedIndex !== selectedIndex) {
      setSelectedIndex(props.selectedIndex);
      setSelectedOption(props.options[props.selectedIndex]);
    }
  }, [props.selectedIndex]);

  const optionSelector = (index: number) => {
    if (
      props.options[index] &&
      props.options[index].name !== selectedOption.name
    ) {
      setSelectedIndex(index);
      setSelectedOption(props.options[index]);
      onSelect && onSelect(props.options[index]);
    }

    setIsDropdownOpen(false);
  };

  return props.isLoading ? (
    <Spinner size={IconSize.LARGE} />
  ) : (
    <Popover
      data-cy={props.cypressSelector}
      interactionKind={PopoverInteractionKind.CLICK}
      isOpen={isDropdownOpen}
      onInteraction={(state) => setIsDropdownOpen(state)}
      position={props.position || Position.BOTTOM_LEFT}
      usePortal={false}
    >
      <Content isLoading={props.isLoading}>
        <SelectedItem className="selected-item" width={props.selectedTextWidth}>
          <Text type={TextType.P1}>{selectedOption.name}</Text>
          <Icon
            fillColor="#A9A7A7"
            hoverFillColor="#A9A7A7"
            name="downArrow"
            size={IconSize.XXXL}
          />
        </SelectedItem>
      </Content>
      <OptionsWrapper>
        {props.options.map((el: TableDropdownOption, index: number) => (
          <DropdownOption
            isSelected={selectedIndex === index}
            key={index}
            onClick={() => optionSelector(index)}
          >
            <Text type={TextType.H5}>{el.name}</Text>
            <Text type={TextType.P3}>{el.desc}</Text>
          </DropdownOption>
        ))}
      </OptionsWrapper>
    </Popover>
  );
}

export default TableDropdown;
