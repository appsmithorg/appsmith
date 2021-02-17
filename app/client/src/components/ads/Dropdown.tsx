import React, { useState, useEffect, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";

type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
  onSelect?: (value?: string) => void;
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: DropdownOption;
  onSelect?: (value?: string) => void;
  width?: number;
};

const DropdownContainer = styled.div<{ width?: number }>`
  width: ${(props) => props.width || 260}px;
  position: relative;
`;

const Selected = styled.div<{ isOpen: boolean; disabled?: boolean }>`
  height: 38px;
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[6]}px;
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

const DropdownWrapper = styled.div<{ width?: number }>`
  width: ${(props) => props.width || 260}px;
  z-index: 1;
  margin-top: ${(props) => props.theme.spaces[2] - 1}px;
  background: ${(props) => props.theme.colors.dropdown.menuBg};
  box-shadow: 0px 12px 28px ${(props) => props.theme.colors.dropdown.menuShadow};
`;

const OptionWrapper = styled.div<{ selected: boolean }>`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[6]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  ${(props) =>
    props.selected
      ? `background: ${props.theme.colors.dropdown.selected.bg}`
      : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.selected
        ? `color: ${props.theme.colors.dropdown.selected.text}`
        : null};
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
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.dropdown.selected.text};
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

export default function Dropdown(props: DropdownProps) {
  const { onSelect } = { ...props };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<DropdownOption>(props.selected);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    setSelected(props.selected);
  }, [props.selected]);

  const optionClickHandler = useCallback(
    (option: DropdownOption) => {
      setSelected(option);
      setIsOpen(false);
      onSelect && onSelect(option.value);
      option.onSelect && option.onSelect(option.value);
    },
    [onSelect],
  );

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setContainerWidth(node.getBoundingClientRect().width);
    }
  }, []);

  return (
    <DropdownContainer
      tabIndex={0}
      data-cy={props.cypressSelector}
      ref={measuredRef}
      width={props.width}
    >
      <Popover
        minimal
        position={Position.BOTTOM_RIGHT}
        isOpen={isOpen && !props.disabled}
        onInteraction={(state) => setIsOpen(state)}
        boundary="viewport"
      >
        <Selected
          isOpen={isOpen}
          disabled={props.disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={props.className}
        >
          <Text type={TextType.P1}>{selected.value}</Text>
          <Icon name="downArrow" size={IconSize.XXS} />
        </Selected>
        <DropdownWrapper width={containerWidth}>
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <OptionWrapper
                key={index}
                selected={selected.value === option.value}
                onClick={() => optionClickHandler(option)}
                className="t--dropdown-option"
              >
                {option.icon ? (
                  <Icon name={option.icon} size={IconSize.LARGE} />
                ) : null}
                {option.label && option.value ? (
                  <LabelWrapper className="label-container">
                    <Text type={TextType.H5}>{option.value}</Text>
                    <Text type={TextType.P3}>{option.label}</Text>
                  </LabelWrapper>
                ) : (
                  <Text type={TextType.P1}>{option.value}</Text>
                )}
              </OptionWrapper>
            );
          })}
        </DropdownWrapper>
      </Popover>
    </DropdownContainer>
  );
}
