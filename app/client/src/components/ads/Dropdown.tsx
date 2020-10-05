import React, { useState, useEffect, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";

type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected?: DropdownOption;
  placeholder?: string;
  input?: {
    value?: string;
    onChange?: (value?: string) => void;
  };
};

const DropdownContainer = styled.div`
  width: 260px;
  position: relative;
`;

const Selected = styled.div<{ isOpen: boolean; disabled?: boolean }>`
  height: 38px;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background: ${props =>
    props.disabled
      ? props.theme.colors.dropdown.header.disabledBg
      : props.theme.colors.dropdown.header.bg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  ${props =>
    props.isOpen
      ? `border: 1px solid ${props.theme.colors.info.main}`
      : props.disabled
      ? `border: 1px solid ${props.theme.colors.dropdown.header.disabledBg}`
      : `border: 1px solid ${props.theme.colors.dropdown.header.bg}`};
  ${props =>
    props.isOpen && !props.disabled ? "box-sizing: border-box" : null};
  ${props =>
    props.isOpen && !props.disabled
      ? "box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
      : null};
  .${Classes.TEXT} {
    ${props =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${props.theme.colors.dropdown.header.text}`};
  }
`;

const DropdownWrapper = styled.div`
  position: absolute;
  top: 38px;
  left: 0px;
  z-index: 1;
  margin-top: ${props => props.theme.spaces[2] - 1}px;
  background: ${props => props.theme.colors.dropdown.menuBg};
  box-shadow: 0px 12px 28px ${props => props.theme.colors.dropdown.menuShadow};
  width: 100%;
`;

const OptionWrapper = styled.div<{ selected: boolean }>`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  ${props =>
    props.selected
      ? `background: ${props.theme.colors.dropdown.selected.bg}`
      : null};
  .${Classes.TEXT} {
    ${props =>
      props.selected
        ? `color: ${props.theme.colors.dropdown.selected.text}`
        : null};
  }
  .${Classes.ICON} {
    margin-right: ${props => props.theme.spaces[5]}px;
    svg {
      path {
        ${props =>
          props.selected
            ? `fill: ${props.theme.colors.dropdown.selected.icon}`
            : `fill: ${props.theme.colors.dropdown.icon}`};
      }
    }
  }

  &:hover {
    .${Classes.TEXT} {
      color: ${props => props.theme.colors.dropdown.selected.text};
    }
    .${Classes.ICON} {
      svg {
        path {
          fill: ${props => props.theme.colors.dropdown.selected.icon};
        }
      }
    }
  }
`;

const LabelWrapper = styled.div<{ label?: string }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  ${props =>
    props.label
      ? `
    .${Classes.TEXT}:last-child {
      margin-top: ${props.theme.spaces[2] - 1}px;
    }
    `
      : null}
`;

export default function Dropdown(props: DropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>(props.placeholder || "");

  useEffect(() => {
    if (props.input && props.input.value) {
      setSelected(props.input.value);
    }
  }, [props.input]);

  const optionClickHandler = useCallback(
    (option: DropdownOption) => {
      if (option.value) {
        setSelected(option.value);
      }
      setIsOpen(false);
      props.input && props.input.onChange && props.input.onChange(option.id);
    },
    [props.input],
  );

  return (
    <DropdownContainer
      tabIndex={0}
      onBlur={() => setIsOpen(false)}
      data-cy={props.cypressSelector}
    >
      <Selected
        isOpen={isOpen}
        disabled={props.disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Text type={TextType.P1}>{selected}</Text>
        <Icon name="downArrow" size={IconSize.XXS} />
      </Selected>

      {isOpen && !props.disabled ? (
        <DropdownWrapper>
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <OptionWrapper
                key={index}
                selected={selected === option.value}
                onClick={() => optionClickHandler(option)}
              >
                {option.icon ? (
                  <Icon name={option.icon} size={IconSize.LARGE} />
                ) : null}
                <LabelWrapper label={option.label}>
                  {option.label ? (
                    <Text type={TextType.H5}>{option.value}</Text>
                  ) : (
                    <Text type={TextType.P1}>{option.value}</Text>
                  )}
                  {option.label ? (
                    <Text type={TextType.P3}>{option.label}</Text>
                  ) : null}
                </LabelWrapper>
              </OptionWrapper>
            );
          })}
        </DropdownWrapper>
      ) : null}
    </DropdownContainer>
  );
}
