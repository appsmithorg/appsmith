import React, { useState, useEffect, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";

export type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
  subText?: string;
  onSelect?: (value?: string) => void;
};

export type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: DropdownOption;
  onSelect?: (value?: string) => void;
  width?: string;
  height?: string;
  showLabelOnly?: boolean;
  optionWidth?: string;
  showDropIcon?: boolean;
  SelectedValueNode?: typeof DefaultDropDownValueNode;
};

export const DropdownContainer = styled.div<{ width: string; height: string }>`
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  position: relative;
`;

const Selected = styled.div<{
  isOpen: boolean;
  disabled?: boolean;
  height: string;
}>`
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
  height: ${(props) => props.height};
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
  width: string;
}>`
  width: ${(props) => props.width};
  z-index: 1;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
  box-shadow: ${(props) => props.theme.colors.dropdown.menuShadow};
  margin-top: ${(props) => -props.theme.spaces[3]}px;
  padding: ${(props) => props.theme.spaces[3]}px 0;
`;

const OptionWrapper = styled.div<{
  selected: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;

  background-color: ${(props) =>
    props.selected ? props.theme.colors.propertyPane.dropdownSelectBg : null};

  &&& svg {
    rect {
      fill: ${(props) => props.theme.colors.dropdownIconBg};
    }
  }

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

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.textOnDarkBG};
    }

    .${Classes.ICON} {
      svg {
        path {
          fill: ${(props) => props.theme.colors.dropdown.hovered.icon};
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

const StyledSubText = styled(Text)`
  margin-left: auto;
  && {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
`;

const SelectedDropDownHolder = styled.div`
  display: flex;
  align-items: center;
`;

const SelectedIcon = styled(Icon)`
  margin-right: 6px;
  & > div:first-child {
    height: 18px;
    width: 18px;

    svg {
      height: 18px;
      width: 18px;

      rect {
        fill: ${(props) => props.theme.colors.dropdownIconBg};
        rx: 0;
      }
      path {
        fill: ${(props) => props.theme.colors.propertyPane.label};
      }
    }
  }
`;

const DefaultDropDownValueNode = ({
  selected,
  showLabelOnly,
}: {
  selected: DropdownOption;
  showLabelOnly?: boolean;
}) => (
  <SelectedDropDownHolder>
    {selected.icon ? (
      <SelectedIcon name={selected.icon} size={IconSize.XXS} />
    ) : null}
    <Text type={TextType.P1}>
      {showLabelOnly ? selected.label : selected.value}
    </Text>
  </SelectedDropDownHolder>
);

export default function Dropdown(props: DropdownProps) {
  const {
    onSelect,
    showDropIcon = true,
    SelectedValueNode = DefaultDropDownValueNode,
  } = { ...props };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<DropdownOption>(props.selected);

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
  console.log({ height: props.height });
  return (
    <DropdownContainer
      tabIndex={0}
      data-cy={props.cypressSelector}
      width={props.width || "260px"}
      height={props.height || "38px"}
    >
      <Popover
        minimal
        popoverClassName={props.className}
        position={Position.BOTTOM_LEFT}
        isOpen={isOpen && !props.disabled}
        onInteraction={(state) => setIsOpen(state)}
        boundary="scrollParent"
      >
        <Selected
          isOpen={isOpen}
          disabled={props.disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={props.className}
          height={props.height || "38px"}
        >
          <SelectedValueNode
            selected={selected}
            showLabelOnly={props.showLabelOnly}
          />
          {showDropIcon && <Icon name="downArrow" size={IconSize.XXS} />}
        </Selected>
        <DropdownWrapper width={props.optionWidth || "260px"}>
          {props.options.map((option: DropdownOption, index: number) => {
            return (
              <OptionWrapper
                key={index}
                selected={selected.value === option.value}
                onClick={() => optionClickHandler(option)}
                className="t--dropdown-option"
              >
                {option.icon ? (
                  <SelectedIcon name={option.icon} size={IconSize.XXS} />
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

                {option.subText ? (
                  <StyledSubText type={TextType.P3}>
                    {option.subText}
                  </StyledSubText>
                ) : null}
              </OptionWrapper>
            );
          })}
        </DropdownWrapper>
      </Popover>
    </DropdownContainer>
  );
}
