import React, { useState, useEffect, useCallback, ReactElement } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled, { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import Spinner from "./Spinner";

export type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
  subText?: string;
  iconSize?: IconSize;
  iconColor?: string;
  onSelect?: (value?: string, dropdownOption?: any) => void;
  data?: any;
};

export interface RenderDropdownOptionType {
  index?: number;
  option: DropdownOption;
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
  isSelectedNode?: boolean;
  extraProps?: any;
  errorMsg?: string;
}

type RenderOption = ({
  errorMsg,
  index,
  option,
  optionClickHandler,
}: RenderDropdownOptionType) => ReactElement<any, any>;

export type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selected: DropdownOption;
  onSelect?: (value?: string, dropdownOption?: any) => void;
  width?: string;
  height?: string;
  showLabelOnly?: boolean;
  optionWrapperHeight?: string;
  optionWidth?: string;
  showDropIcon?: boolean;
  SelectedValueNode?: typeof DefaultDropDownValueNode;
  renderOption?: RenderOption;
  bgColor?: string;
  isLoading?: boolean;
  errorMsg?: string; // If errorMsg is defined, we show dropDown's error state with the message.
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
  bgColor?: string;
}>`
  padding: ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[3]}px;
  background: ${(props) =>
    props.disabled
      ? props.theme.colors.dropdown.header.disabledBg
      : !!props.bgColor
      ? props.bgColor
      : props.theme.colors.dropdown.header.bg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${(props) => props.height};
  cursor: pointer;
  ${(props) =>
    props.isOpen
      ? `border: 1px solid ${
          !!props.bgColor ? props.bgColor : props.theme.colors.info.main
        }`
      : props.disabled
      ? `border: 1px solid ${props.theme.colors.dropdown.header.disabledBg}`
      : `border: 1px solid ${
          !!props.bgColor
            ? props.bgColor
            : props.theme.colors.dropdown.header.bg
        }`};
  ${(props) =>
    props.isOpen && !props.disabled ? "box-sizing: border-box" : null};
  ${(props) =>
    props.isOpen && !props.disabled && !props.bgColor
      ? "box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
      : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${
            !!props.bgColor
              ? Colors.WHITE
              : props.theme.colors.dropdown.header.text
          }`};
  }
`;

const DropdownSelect = styled.div``;

const DropdownWrapper = styled.div<{
  maxHeight: string;
  width: string;
}>`
  width: ${(props) => props.width};
  max-height: ${(props) => (props.maxHeight ? props.maxHeight : "")};
  overflow-y: ${(props) => (props.maxHeight ? "scroll" : "")};
  z-index: 1;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
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

const ErrorMsg = styled.span`
  ${(props) => getTypographyByKey(props, "p3")};
  color: #f22b2b;
  margin: 6px 0px 10px;
`;

const ErrorLabel = styled.span`
  ${(props) => getTypographyByKey(props, "p1")};
  color: #f22b2b;
`;

function DefaultDropDownValueNode({
  errorMsg,
  renderNode,
  selected,
  showLabelOnly,
}: {
  errorMsg?: string;
  selected: DropdownOption;
  showLabelOnly?: boolean;
  renderNode?: RenderOption;
}) {
  const LabelText = showLabelOnly ? selected.label : selected.value;
  function Label() {
    return errorMsg ? (
      <ErrorLabel>{LabelText}</ErrorLabel>
    ) : (
      <Text type={TextType.P1}>{LabelText}</Text>
    );
  }
  return (
    <SelectedDropDownHolder>
      {renderNode ? (
        renderNode({ isSelectedNode: true, option: selected, errorMsg })
      ) : (
        <>
          {selected.icon ? (
            <SelectedIcon name={selected.icon} size={IconSize.XXS} />
          ) : null}
          <Label />
        </>
      )}
    </SelectedDropDownHolder>
  );
}

export default function Dropdown(props: DropdownProps) {
  const {
    onSelect,
    showDropIcon = true,
    isLoading = false,
    SelectedValueNode = DefaultDropDownValueNode,
    renderOption,
    errorMsg = "",
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
      onSelect && onSelect(option.value, option);
      option.onSelect && option.onSelect(option.value, option);
    },
    [onSelect],
  );

  const disabled = props.disabled || isLoading;
  const downIconColor = errorMsg ? "#f22b2b" : "";
  return (
    <DropdownContainer
      data-cy={props.cypressSelector}
      height={props.height || "38px"}
      tabIndex={0}
      width={props.width || "260px"}
    >
      <Popover
        boundary="scrollParent"
        isOpen={isOpen && !disabled}
        minimal
        onInteraction={(state) => setIsOpen(state)}
        popoverClassName={props.className}
        position={Position.BOTTOM_LEFT}
      >
        <DropdownSelect>
          <Selected
            bgColor={props.bgColor}
            className={props.className}
            disabled={disabled}
            height={props.height || "38px"}
            isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <SelectedValueNode
              errorMsg={errorMsg}
              renderNode={renderOption}
              selected={selected}
              showLabelOnly={props.showLabelOnly}
            />
            {isLoading ? (
              <Spinner size={IconSize.LARGE} />
            ) : showDropIcon ? (
              <Icon
                fillColor={downIconColor}
                hoverFillColor={downIconColor}
                name="downArrow"
                size={IconSize.XXS}
              />
            ) : null}
          </Selected>
          {errorMsg && !isOpen ? <ErrorMsg>{errorMsg}</ErrorMsg> : null}
        </DropdownSelect>
        <DropdownWrapper
          maxHeight={props.optionWrapperHeight || "auto"}
          width={props.optionWidth || "260px"}
        >
          {props.options.map((option: DropdownOption, index: number) => {
            if (renderOption) {
              return renderOption({
                option,
                index,
                optionClickHandler,
              });
            }
            return (
              <OptionWrapper
                className="t--dropdown-option"
                key={index}
                onClick={() => optionClickHandler(option)}
                selected={selected.value === option.value}
              >
                {option.icon ? (
                  <SelectedIcon
                    fillColor={option?.iconColor}
                    name={option.icon}
                    size={option.iconSize || IconSize.XXS}
                  />
                ) : null}

                {props.showLabelOnly ? (
                  <Text type={TextType.P1}>{option.label}</Text>
                ) : option.label && option.value ? (
                  <LabelWrapper className="label-container">
                    <Text type={TextType.H5}>{option.value}</Text>
                    <Text type={TextType.P1}>{option.label}</Text>
                  </LabelWrapper>
                ) : (
                  <Text type={TextType.P1}>{option.value}</Text>
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
