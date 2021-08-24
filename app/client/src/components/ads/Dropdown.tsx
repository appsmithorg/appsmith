import React, { useState, useEffect, useCallback, ReactElement } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import { getTypographyByKey } from "constants/DefaultTheme";
import styled from "constants/DefaultTheme";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
import { Colors } from "constants/Colors";
import Spinner from "./Spinner";

export type DropdownOnSelect = (value?: string, dropdownOption?: any) => void;

export type DropdownOption = {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
  leftElement?: string;
  searchText?: string;
  subText?: string;
  iconSize?: IconSize;
  iconColor?: string;
  onSelect?: DropdownOnSelect;
  data?: any;
};
export interface DropdownSearchProps {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: any) => void;
}

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

export type DropdownProps = CommonComponentProps &
  DropdownSearchProps & {
    options: DropdownOption[];
    selected: DropdownOption;
    onSelect?: DropdownOnSelect;
    width?: string;
    height?: string;
    showLabelOnly?: boolean;
    optionWidth?: string;
    dropdownHeight?: string;
    dropdownMaxHeight?: string;
    showDropIcon?: boolean;
    dropdownTriggerIcon?: React.ReactNode;
    containerClassName?: string;
    headerLabel?: string;
    SelectedValueNode?: typeof DefaultDropDownValueNode;
    bgColor?: string;
    renderOption?: RenderOption;
    isLoading?: boolean;
    errorMsg?: string; // If errorMsg is defined, we show dropDown's error state with the message.
    helperText?: string;
  };
export interface DefaultDropDownValueNodeProps {
  selected: DropdownOption;
  showLabelOnly?: boolean;
  isOpen?: boolean;
  errorMsg?: string;
  renderNode?: RenderOption;
}

export interface RenderDropdownOptionType {
  option: DropdownOption;
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
}

export const DropdownContainer = styled.div<{ width: string }>`
  width: ${(props) => props.width};
  position: relative;
`;

const DropdownTriggerWrapper = styled.div<{
  isOpen: boolean;
  disabled?: boolean;
}>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  ${(props) =>
    props.isOpen && !props.disabled ? "box-sizing: border-box" : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${props.theme.colors.dropdown.header.text}`};
  }
`;

const Selected = styled.div<{
  isOpen: boolean;
  disabled?: boolean;
  height: string;
  bgColor?: string;
  hasError?: boolean;
  isLoading?: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[3]}px;
  background: ${(props) => {
    if (props.disabled) {
      return props.theme.colors.dropdown.header.disabledBg;
    } else if (props.hasError) {
      return Colors.FAIR_PINK;
    }
    return !!props.bgColor
      ? props.bgColor
      : props.theme.colors.dropdown.header.bg;
  }};

  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${(props) => props.height};
  cursor: ${(props) =>
    props.disabled || props.isLoading ? "not-allowed" : "pointer"};
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
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: calc(100% - 10px);
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

export const DropdownWrapper = styled.div<{
  width: string;
}>`
  width: ${(props) => props.width};
  z-index: 1;
  background-color: ${(props) => props.theme.colors.propertyPane.radioGroupBg};
  margin-top: ${(props) => -props.theme.spaces[3]}px;
  padding: ${(props) => props.theme.spaces[3]}px 0;
  .dropdown-search {
    margin: 4px 12px 8px;
    width: calc(100% - 24px);
  }
`;

const DropdownOptionsWrapper = styled.div<{
  maxHeight?: string;
  height: string;
}>`
  display: flex;
  flex-direction: column;
  height: ${(props) => props.height};
  max-height: ${(props) => props.maxHeight};
  overflow-y: auto;
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

const LeftIconWrapper = styled.span`
  margin-right: 15px;
  height: 100%;
  position: relative;
  top: 1px;
`;

const HeaderWrapper = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 10px;
  padding: 0px 7px 7px 7px;
`;

const SelectedDropDownHolder = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
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
  color: ${Colors.POMEGRANATE2};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const ErrorLabel = styled.span`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.POMEGRANATE2};
`;

const HelperText = styled.span`
  ${(props) => getTypographyByKey(props, "p3")};
  color: ${Colors.GRAY};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

function DefaultDropDownValueNode({
  errorMsg,
  renderNode,
  selected,
  showLabelOnly,
}: DefaultDropDownValueNodeProps) {
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
            <SelectedIcon
              fillColor={selected?.iconColor}
              hoverFillColor={selected?.iconColor}
              name={selected.icon}
              size={selected.iconSize || IconSize.XXS}
            />
          ) : null}
          <Label />
        </>
      )}
    </SelectedDropDownHolder>
  );
}

interface DropdownOptionsProps extends DropdownProps, DropdownSearchProps {
  optionClickHandler: (option: DropdownOption) => void;
  renderOption?: RenderOption;
  headerLabel?: string;
  selected: DropdownOption;
}

export function RenderDropdownOptions(props: DropdownOptionsProps) {
  const { onSearch, optionClickHandler, renderOption } = props;
  const [options, setOptions] = useState<Array<DropdownOption>>(props.options);
  const [searchValue, setSearchValue] = useState<string>("");
  const onOptionSearch = (searchStr: string) => {
    const search = searchStr.toLocaleUpperCase();
    const filteredOptions: Array<DropdownOption> = props.options.filter(
      (option: DropdownOption) => {
        return (
          option.label?.toLocaleUpperCase().includes(search) ||
          option.searchText?.toLocaleUpperCase().includes(search)
        );
      },
    );
    setSearchValue(searchStr);
    setOptions(filteredOptions);
    onSearch && onSearch(searchStr);
  };
  return (
    <DropdownWrapper
      className="ads-dropdown-options-wrapper"
      width={props.optionWidth || "260px"}
    >
      {props.enableSearch && (
        <SearchComponent
          className="dropdown-search"
          onSearch={onOptionSearch}
          placeholder={props.searchPlaceholder || ""}
          value={searchValue}
        />
      )}
      {props.headerLabel && <HeaderWrapper>{props.headerLabel}</HeaderWrapper>}
      <DropdownOptionsWrapper
        height={props.dropdownHeight || "100%"}
        maxHeight={props.dropdownMaxHeight || "auto"}
      >
        {options.map((option: DropdownOption, index: number) => {
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
              onClick={() => props.optionClickHandler(option)}
              selected={props.selected.value === option.value}
            >
              {option.leftElement && (
                <LeftIconWrapper>{option.leftElement}</LeftIconWrapper>
              )}
              {option.icon ? (
                <SelectedIcon
                  fillColor={option?.iconColor}
                  hoverFillColor={option?.iconColor}
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
      </DropdownOptionsWrapper>
    </DropdownWrapper>
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
    helperText = "",
  } = { ...props };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<DropdownOption>(props.selected);

  const closeIfOpen = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    setSelected(props.selected);
    closeIfOpen();
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

  const disabled = props.disabled || isLoading || !!errorMsg;
  const downIconColor = errorMsg ? Colors.POMEGRANATE2 : Colors.DARK_GRAY;

  const dropdownHeight = props.height ? props.height : "38px";

  const onClickHandler = () => {
    if (!props.disabled) {
      setIsOpen(!isOpen);
    }
  };

  const dropdownTrigger = props.dropdownTriggerIcon ? (
    <DropdownTriggerWrapper
      disabled={props.disabled}
      isOpen={isOpen}
      onClick={onClickHandler}
    >
      {props.dropdownTriggerIcon}
    </DropdownTriggerWrapper>
  ) : (
    <DropdownSelect>
      <Selected
        bgColor={props.bgColor}
        className={props.className}
        disabled={props.disabled}
        hasError={!!errorMsg}
        height={dropdownHeight}
        isLoading={isLoading}
        isOpen={isOpen}
        onClick={onClickHandler}
      >
        <SelectedValueNode
          errorMsg={errorMsg}
          renderNode={renderOption}
          selected={selected}
          showLabelOnly={props.showLabelOnly}
        />
        {isLoading ? (
          <Spinner size={IconSize.LARGE} />
        ) : (
          showDropIcon && (
            <Icon
              fillColor={downIconColor}
              hoverFillColor={downIconColor}
              name="downArrow"
              size={IconSize.XXS}
            />
          )
        )}
      </Selected>
      {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
      {helperText && !isOpen && !errorMsg && (
        <HelperText>{helperText}</HelperText>
      )}
    </DropdownSelect>
  );
  return (
    <DropdownContainer
      className={props.containerClassName}
      data-cy={props.cypressSelector}
      tabIndex={0}
      width={props.width || "260px"}
    >
      <Popover
        boundary="scrollParent"
        isOpen={isOpen && !disabled}
        minimal
        onInteraction={(state) => !disabled && setIsOpen(state)}
        popoverClassName={props.className}
        position={Position.BOTTOM_LEFT}
      >
        {dropdownTrigger}
        <RenderDropdownOptions
          optionClickHandler={optionClickHandler}
          {...props}
        />
      </Popover>
    </DropdownContainer>
  );
}
