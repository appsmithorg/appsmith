import React, { useState, useEffect, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";

type DropdownOption = {
  label?: string;
  value: string;
  id?: string;
  icon?: IconName;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
};

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: DropdownOption;
};

const DropdownContainer = styled.div`
  width: 260px;
`;

const Selected = styled.div<{ isOpen: boolean; disabled?: boolean }>`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background: ${props =>
    props.disabled
      ? props.theme.colors.blackShades[2]
      : props.theme.colors.blackShades[0]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  ${props =>
    props.isOpen && !props.disabled
      ? `border: 1.2px solid ${props.theme.colors.info.main}`
      : null};
  ${props =>
    props.isOpen && !props.disabled ? "box-sizing: border-box" : null};
  ${props =>
    props.isOpen && !props.disabled
      ? "box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
      : null};
  .${Classes.TEXT} {
    ${props =>
      props.disabled
        ? `color: ${props.theme.colors.blackShades[6]}`
        : `color: ${props.theme.colors.blackShades[7]}`};
  }
`;

const DropdownWrapper = styled.div`
  margin-top: ${props => props.theme.spaces[2] - 1}px;
  background: ${props => props.theme.colors.blackShades[3]};
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.6);
  width: 100%;
`;

const OptionWrapper = styled.div<{ selected: boolean }>`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  ${props =>
    props.selected ? `background: ${props.theme.colors.blackShades[4]}` : null};
  .${Classes.TEXT} {
    ${props =>
      props.selected ? `color: ${props.theme.colors.blackShades[9]}` : null};
  }
  .${Classes.ICON} {
    margin-right: ${props => props.theme.spaces[5]}px;
    svg {
      path {
        ${props =>
          props.selected
            ? `fill: ${props.theme.colors.blackShades[8]}`
            : `fill: ${props.theme.colors.blackShades[6]}`};
      }
    }
  }

  &:hover {
    .${Classes.TEXT} {
      color: ${props => props.theme.colors.blackShades[9]};
    }
    .${Classes.ICON} {
      svg {
        path {
          fill: ${props => props.theme.colors.blackShades[8]};
        }
      }
    }
  }
`;

const LabelWrapper = styled.div<{ label?: string }>`
  display: flex;
  flex-direction: column;
  align-item: flex-start;

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
  const [selected, setSelected] = useState<DropdownOption>(props.selected);

  useEffect(() => {
    setSelected(props.selected);
  }, [props.selected]);

  const optionClickHandler = useCallback((option: DropdownOption) => {
    setSelected(option);
    setIsOpen(false);
    option.onSelect && option.onSelect(option);
  }, []);

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
        <Text type={TextType.P1}>{selected.value}</Text>
        <Icon name="downArrow" size={IconSize.SMALL} />
      </Selected>

      {isOpen && !props.disabled ? (
        <DropdownWrapper>
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <OptionWrapper
                key={index}
                selected={selected.value === option.value}
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
