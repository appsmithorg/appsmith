import React, { useState, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import _ from "lodash";

const DropdownContainer = styled.div<{ width?: string }>`
  width: ${(props) => props.width || "260px"};
  position: relative;
`;

const Selected = styled.div<{ isOpen: boolean; disabled?: boolean }>`
  height: 38px;
  padding: ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[3]}px;
  background: ${(props) =>
    props.disabled
      ? props.theme.colors.dropdown.header.disabledBg
      : props.theme.colors.dropdown.header.bg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  ${(props) =>
    props.isOpen
      ? `border: 1px solid ${props.theme.colors.info.main}`
      : props.disabled
      ? `border: 1px solid ${props.theme.colors.dropdown.header.disabledBg}`
      : `border: 1px solid ${props.theme.colors.dropdown.header.bg}`};
  ${(props) =>
    props.isOpen && !props.disabled ? "box-sizing: border-box" : null};
  ${(props) =>
    props.isOpen && !props.disabled
      ? "box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
      : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${props.theme.colors.dropdown.header.text}`};
  }
`;

const DropdownWrapper = styled.div<{
  width?: string;
}>`
  width: ${(props) => props.width || "260px"};
  z-index: 1;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
  box-shadow: ${(props) =>
    `0px 2px 4px ${props.theme.colors.dropdown.menuShadow}`};
  margin-top: ${(props) => -props.theme.spaces[3]}px;
  padding: ${(props) => props.theme.spaces[3]}px 0;
`;

const OptionWrapper = styled.div<{
  selected: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2] - 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;

  background-color: ${(props) =>
    props.selected ? props.theme.colors.propertyPane.dropdownSelectBg : null};

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.propertyPane.label};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
    svg {
      path {
        ${(props) =>
          props.selected
            ? `fill: ${props.theme.colors.dropdown.selected.icon}`
            : `fill: ${props.theme.colors.dropdown.icon}`};
      }
    }
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.dropdown.hovered.bg};

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.textOnDarkBG};
    }

    .${Classes.ICON} {
      svg {
        path {
          fill: ${(props) => props.theme.colors.dropdown.selected.icon};
        }
      }
    }
  }
`;

const LabelWrapper = styled.div<{ label?: string }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  span:last-child {
    margin-top: ${(props) => props.theme.spaces[2] - 1}px;
  }
  &:hover {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.dropdown.selected.text};
    }
  }
`;

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
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border: 1px solid;
  box-sizing: border-box;
`;

export type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: string[];
  onSelect: (value: string[]) => void;
  width?: string;
  showLabelOnly?: boolean;
  optionWidth?: string;
  selectAll?: boolean;
  selectAllQuantifier?: string;
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

    let selectedOption = [...props.selected];

    if (currentIndex === -1) {
      selectedOption.push(option);
    } else {
      selectedOption.splice(currentIndex, 1);
    }

    if (props.selectAll) {
      const isAllSelectorPresent = props.selected.includes(
        props.selectAllQuantifier as string,
      );
      const isAllSelectorSelected =
        props.selectAllQuantifier && option === props.selectAllQuantifier;

      if (isAllSelectorSelected) {
        if (isAllSelectorPresent) {
          selectedOption = [];
        } else {
          selectedOption = _.map(
            props.options,
            (item) => item.value,
          ) as string[];
        }
      } else if (isAllSelectorPresent) {
        selectedOption = selectedOption.filter(
          (item) => item !== props.selectAllQuantifier,
        );
      } else if (
        !isAllSelectorPresent &&
        selectedOption.length === props.options.length - 1
      ) {
        selectedOption = _.map(props.options, (item) => item.value) as string[];
      }
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
                  <Text type={TextType.P3}>{option.label}</Text>
                ) : option.label && option.value ? (
                  <LabelWrapper className="label-container">
                    <Text type={TextType.H5}>{option.value}</Text>
                    <Text type={TextType.P3}>{option.label}</Text>
                  </LabelWrapper>
                ) : (
                  <Text type={TextType.P3}>{option.value}</Text>
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
