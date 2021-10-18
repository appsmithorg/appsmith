import React, { useState, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import _ from "lodash";
import { Colors } from "constants/Colors";

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
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${props.theme.colors.dropdown.header.text}`};
  }

  svg {
    fill: ${Colors.DARK_GRAY};
    margin-right: 8px;
  }
`;

const DropdownWrapper = styled.div<{
  width?: string;
}>`
  width: ${(props) => props.width || "260px"};
  z-index: 1;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
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
    color: ${Colors.CHARCOAL};
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
      color: ${Colors.CHARCOAL};
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
      color: ${Colors.CHARCOAL};
    }
  }
`;

const MultiOptionWrapper = styled(OptionWrapper)`
  background-color: transparent;
  .${Classes.MULTI_SELECT_BOX} {
    background-color: ${(props) =>
      props.selected ? Colors.DANUBE : "transparent"};
    border-color: ${(props) =>
      props.selected
        ? Colors.DANUBE
        : props.theme.colors.propertyPane.jsIconBg};
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

function MultiSelectDropdown(props: DropdownProps) {
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
      data-cy={props.cypressSelector}
      ref={measuredRef}
      tabIndex={0}
      width={props.width}
    >
      <Popover
        boundary="scrollParent"
        isOpen={isOpen && !props.disabled}
        minimal
        onInteraction={(state) => setIsOpen(state)}
        position={Position.TOP_LEFT}
      >
        <Selected
          className={props.className}
          disabled={props.disabled}
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Text type={TextType.P1}>
            {props.selected.length
              ? `${props.selected.length} Selected`
              : "Select file types"}
          </Text>
          <Icon name="expand-more" size={IconSize.XXL} />
        </Selected>
        <DropdownWrapper
          width={props.optionWidth ? props.optionWidth : containerWidth}
        >
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <MultiOptionWrapper
                className="t--multi-dropdown-option"
                key={index}
                onClick={() => {
                  optionClickHandler(option.value as string);
                }}
                selected={isItemSelected(option.value)}
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
}

export default MultiSelectDropdown;
