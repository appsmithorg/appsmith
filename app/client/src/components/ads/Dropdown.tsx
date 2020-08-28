import React, { ReactNode, useState, useEffect, useCallback } from "react";
import Icon, { IconName } from "./Icon";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import { Size } from "./Button";

type DropdownOption = {
  label?: string;
  value: string;
  id?: string;
  icon?: IconName; // Create an icon library
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
};

// export enum DropdownDisplayType {
//   TAGS = "TAGS",
//   CHECKBOXES = "CHECKBOXES",
// }

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selectHandler: (selectedValue: string) => void;
  selected: DropdownOption;
  // multiselectDisplayType?: DropdownDisplayType;
  // checked?: boolean;
  // multi?: boolean;
  // autocomplete?: boolean;
  // addItem?: {
  //   displayText: string;
  //   addItemHandler: (name: string) => void;
  // };
  // toggle?: ReactNode;
};

const DropdownContainer = styled.div`
  width: 260px;
`;

const Select = styled.div<{ isOpen: boolean }>`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background: ${props => props.theme.colors.blackShades[0]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  ${props => (props.isOpen ? "border: 1.2px solid #CB4810" : null)};
  ${props => (props.isOpen ? "box-sizing: border-box" : null)};
  ${props =>
    props.isOpen
      ? "box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
      : null};

  .ads-icon {
    svg {
      width: 8px;
      height: 5px;
    }
  }
`;

const DropdownWrapper = styled.div`
  margin-top: 5px;
  background: #2b2b2b;
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.6);
  width: 100%;
`;

const OptionWrapper = styled.div<{ selected: boolean }>`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  ${props => (props.selected ? "background: #404040" : null)};
  span {
    ${props => (props.selected ? "color: #FFFFFF" : null)};
  }
  .ads-icon {
    margin-right: 12px;
    svg {
      path {
        ${props => (props.selected ? "fill: #E9E9E9" : "fill: #9F9F9F")};
      }
    }
  }

  &:hover {
    span {
      color: #ffffff;
    }
    svg {
      path {
        fill: #e9e9e9;
      }
    }
  }
`;

const LabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-item: flex-start;

  span {
  }
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

  const selectedHandler = useCallback(() => {
    setIsOpen(!isOpen);
    selected.onSelect && selected.onSelect(selected);
  }, []);

  return (
    <DropdownContainer tabIndex={0} onBlur={() => setIsOpen(false)}>
      <Select isOpen={isOpen} onClick={selectedHandler}>
        <Text type={TextType.P1}>{selected.value}</Text>
        <Icon name="downArrow" size={Size.small} />
      </Select>

      {isOpen ? (
        <DropdownWrapper>
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <OptionWrapper
                key={index}
                selected={props.selected.value === option.value}
                onClick={() => optionClickHandler(option)}
              >
                {option.icon ? (
                  <Icon name={option.icon} size={Size.large} />
                ) : null}
                <LabelWrapper>
                  <Text type={TextType.P1}>{option.value}</Text>
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
