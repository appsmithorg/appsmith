import React, { useState, useCallback } from "react";
import Icon, { IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import {
  DropdownContainer,
  DropdownOption,
  DropdownWrapper,
  LabelWrapper,
  OptionWrapper,
  Selected,
} from "./Dropdown";
import _ from "lodash";

const MultiOptionWrapper = styled(OptionWrapper)`
  background-color: transparent;
  .${Classes.MULTI_SELECT_BOX} {
    background-color: ${(props) =>
      props.selected ? props.theme.colors.dropdown.hovered.bg : "transparent"};
    border-color: ${(props) =>
      props.selected
        ? props.theme.colors.dropdown.hovered.bg
        : props.theme.colors.propertyPane.jsIconBg};
  }

  &:hover {
    .${Classes.MULTI_SELECT_BOX} {
      border-color: ${(props) =>
        props.selected
          ? props.theme.colors.propertyPane.multiDropdownBoxHoverBg
          : props.theme.colors.textOnDarkBG};
      background-color: ${(props) =>
        props.selected
          ? props.theme.colors.propertyPane.multiDropdownBoxHoverBg
          : "transparent"};
    }
  }
`;

const SquareBox = styled.div`
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border: 1px solid;
  box-sizing: border-box;
`;

export type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: string[];
  onSelect: (value: string[]) => void;
  width?: string;
  showLabelOnly?: boolean;
  optionWidth?: string;
};

const MultiSelectDropdown = (props: DropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<string>("0px");

  const measuredRef = useCallback((node) => {
    if (node !== null && !props.optionWidth) {
      setContainerWidth(`${node.getBoundingClientRect().width}px`);
    }
  }, []);

  const optionClickHandler = (option: string) => {
    const currentIndex = _.findIndex(props.selected, (value) => {
      return value === option;
    });

    const selectedOption = [...props.selected];

    if (currentIndex === -1) {
      selectedOption.push(option);
    } else {
      selectedOption.splice(currentIndex, 1);
    }

    props.onSelect && props.onSelect([...selectedOption]);
  };

  const isItemSelected = (item?: string) => {
    if (!item) {
      return false;
    }
    return props.selected.includes(item);
  };

  return (
    <DropdownContainer
      tabIndex={0}
      data-cy={props.cypressSelector}
      ref={measuredRef}
      width={props.width}
    >
      <Popover
        minimal
        position={Position.TOP_LEFT}
        isOpen={isOpen && !props.disabled}
        onInteraction={(state) => setIsOpen(state)}
        boundary="scrollParent"
      >
        <Selected
          isOpen={isOpen}
          disabled={props.disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={props.className}
        >
          <Text type={TextType.P1}>
            {props.selected.length
              ? `${props.selected.length} Selected`
              : "Select file types"}
          </Text>
          <Icon name="downArrow" size={IconSize.XXS} />
        </Selected>
        <DropdownWrapper
          width={props.optionWidth ? props.optionWidth : containerWidth}
        >
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <MultiOptionWrapper
                key={index}
                selected={isItemSelected(option.value)}
                onClick={() => {
                  optionClickHandler(option.value as string);
                }}
                className="t--multi-dropdown-option"
              >
                <SquareBox className={Classes.MULTI_SELECT_BOX} />
                {option.icon ? (
                  <Icon name={option.icon} size={IconSize.LARGE} />
                ) : null}
                {props.showLabelOnly ? (
                  <Text type={TextType.P1}>{option.label}</Text>
                ) : option.label && option.value ? (
                  <LabelWrapper className="label-container">
                    <Text type={TextType.H5}>{option.value}</Text>
                    <Text type={TextType.P3}>{option.label}</Text>
                  </LabelWrapper>
                ) : (
                  <Text type={TextType.P1}>{option.value}</Text>
                )}
              </MultiOptionWrapper>
            );
          })}
        </DropdownWrapper>
      </Popover>
    </DropdownContainer>
  );
};

export default MultiSelectDropdown;
