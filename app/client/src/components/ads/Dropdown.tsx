import React, { ReactNode, useState, useEffect, useCallback } from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextType } from "./Text";
import { Popover, Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
import { Colors } from "constants/Colors";

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
  onSelect?: (value?: string) => void;
};
export interface DropdownSearchProps {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: any) => void;
}

export type DropdownProps = CommonComponentProps &
  DropdownSearchProps & {
    options: DropdownOption[];
    selected: DropdownOption;
    onSelect?: (value?: string) => void;
    width?: string;
    height?: string;
    showLabelOnly?: boolean;
    optionWidth?: string;
    dropdownHeight?: string;
    showDropIcon?: boolean;
    dropdownTriggerIcon?: ReactNode;
    containerClassName?: string;
    headerLabel?: string;
    SelectedValueNode?: typeof DefaultDropDownValueNode;
    bgColor?: string;
    renderOption?: RenderOption;
  };
export interface DefaultDropDownValueNodeProps {
  selected: DropdownOption;
  showLabelOnly?: boolean;
  isOpen?: boolean;
}

export interface RenderDropdownOptionType {
  option: DropdownOption;
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
}

type RenderOption = ({
  option,
  optionClickHandler,
}: RenderDropdownOptionType) => ReactNode;

export const DropdownContainer = styled.div<{ width: string; height: string }>`
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  position: relative;
`;

const DropdownTriggerWrapper = styled.div<{
  isOpen: boolean;
  disabled?: boolean;
  height: string;
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

const DropdownWrapper = styled.div<{
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
  height: string;
}>`
  display: flex;
  flex-direction: column;
  height: ${(props) => props.height};
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
  color: #6d6d6d;
  font-size: 10px;
  padding: 0px 7px 7px 7px;
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

export function DefaultDropDownValueNode({
  selected,
  showLabelOnly,
}: DefaultDropDownValueNodeProps) {
  return (
    <SelectedDropDownHolder>
      {selected.icon ? (
        <SelectedIcon
          name={selected.icon}
          size={selected.iconSize || IconSize.XXS}
        />
      ) : null}
      <Text type={TextType.P1}>
        {showLabelOnly ? selected.label : selected.value}
      </Text>
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
  const { onSearch } = props;
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
    <DropdownWrapper width={props.optionWidth || "260px"}>
      {props.enableSearch && (
        <SearchComponent
          className="dropdown-search"
          onSearch={onOptionSearch}
          placeholder={props.searchPlaceholder || ""}
          value={searchValue}
        />
      )}
      {props.headerLabel && <HeaderWrapper>{props.headerLabel}</HeaderWrapper>}
      <DropdownOptionsWrapper height={props.dropdownHeight || "100%"}>
        {options.map((option: DropdownOption, index: number) => {
          if (props.renderOption) {
            return props.renderOption({
              option,
              optionClickHandler: props.optionClickHandler,
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
  const dropdownTrigger = props.dropdownTriggerIcon ? (
    <DropdownTriggerWrapper
      disabled={props.disabled}
      height={props.height || "38px"}
      isOpen={isOpen}
      onClick={() => setIsOpen(!isOpen)}
    >
      {props.dropdownTriggerIcon}
    </DropdownTriggerWrapper>
  ) : (
    <Selected
      bgColor={props.bgColor}
      className={props.className}
      disabled={props.disabled}
      height={props.height || "38px"}
      isOpen={isOpen}
      onClick={() => setIsOpen(!isOpen)}
    >
      <SelectedValueNode
        isOpen={isOpen}
        selected={selected}
        showLabelOnly={props.showLabelOnly}
      />
      {showDropIcon && <Icon name="downArrow" size={IconSize.XXS} />}
    </Selected>
  );
  return (
    <DropdownContainer
      className={props.containerClassName}
      data-cy={props.cypressSelector}
      height={props.height || "38px"}
      tabIndex={0}
      width={props.width || "260px"}
    >
      <Popover
        boundary="scrollParent"
        isOpen={isOpen && !props.disabled}
        minimal
        onInteraction={(state) => setIsOpen(state)}
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
