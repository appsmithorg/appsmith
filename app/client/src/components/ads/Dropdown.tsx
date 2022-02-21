import React, {
  useState,
  useEffect,
  useCallback,
  ReactElement,
  useRef,
} from "react";
import Icon, { IconName, IconSize } from "./Icon";
import { CommonComponentProps, Classes } from "./common";
import Text, { TextProps, TextType } from "./Text";
import { Popover, PopperBoundary, Position } from "@blueprintjs/core";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import styled from "constants/DefaultTheme";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
import { Colors } from "constants/Colors";
import Spinner from "./Spinner";
import { ReactComponent as Check } from "assets/icons/control/checkmark.svg";
import { ReactComponent as Close } from "assets/icons/control/remove.svg";
import { replayHighlightClass } from "globalStyles/portals";
import Tooltip from "components/ads/Tooltip";
import { isEllipsisActive } from "utils/helpers";
import SegmentHeader from "components/ads/ListSegmentHeader";
import { useTheme } from "styled-components";
import { findIndex, isArray } from "lodash";

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
  isSectionHeader?: boolean;
};
export interface DropdownSearchProps {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: any) => void;
}

export interface RenderDropdownOptionType {
  index?: number;
  option: DropdownOption | DropdownOption[];
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
  isSelectedNode?: boolean;
  extraProps?: any;
  hasError?: boolean;
  optionWidth: string;
}

type RenderOption = ({
  hasError,
  index,
  option,
  optionClickHandler,
  optionWidth,
}: RenderDropdownOptionType) => ReactElement<any, any>;

export type DropdownProps = CommonComponentProps &
  DropdownSearchProps & {
    options: DropdownOption[];
    selected: DropdownOption | DropdownOption[];
    onSelect?: DropdownOnSelect;
    isMultiSelect?: boolean;
    width?: string;
    height?: string;
    showLabelOnly?: boolean;
    optionWidth?: string;
    dropdownHeight?: string;
    dropdownMaxHeight?: string;
    showDropIcon?: boolean;
    closeOnSpace?: boolean;
    dropdownTriggerIcon?: React.ReactNode;
    containerClassName?: string;
    headerLabel?: string;
    SelectedValueNode?: typeof DefaultDropDownValueNode;
    bgColor?: string;
    renderOption?: RenderOption;
    isLoading?: boolean;
    hasError?: boolean; // should be displayed as error status without error message
    errorMsg?: string; // If errorMsg is defined, we show dropDown's error state with the message.
    placeholder?: string;
    helperText?: string;
    /**
     * if fillOptions is true,
     * dropdown popover width will be same as dropdown width
     * @type {boolean}
     */
    fillOptions?: boolean;
    dontUsePortal?: boolean;
    hideSubText?: boolean;
    removeSelectedOption?: DropdownOnSelect;
    boundary?: PopperBoundary;
    defaultIcon?: IconName;
    truncateOption?: boolean; // enabled wrapping and adding tooltip on option item of dropdown menu
  };
export interface DefaultDropDownValueNodeProps {
  selected: DropdownOption | DropdownOption[];
  showLabelOnly?: boolean;
  isMultiSelect?: boolean;
  isOpen?: boolean;
  hasError?: boolean;
  renderNode?: RenderOption;
  selectedOptionClickHandler?: (option: DropdownOption) => void;
  placeholder?: string;
  showDropIcon?: boolean;
  optionWidth: string;
  hideSubText?: boolean;
}

export interface RenderDropdownOptionType {
  option: DropdownOption | DropdownOption[];
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
}

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
    props.isOpen && !props.disabled
      ? `
      box-sizing: border-box;
      border: 1px solid ${Colors.GREEN_1};
      box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2};
    `
      : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: ${props.theme.colors.dropdown.header.disabledText}`
        : `color: ${props.theme.colors.dropdown.header.text}`};
  }
`;

const StyledCheckmark = styled(Check)`
  width: 14px;
  height: 14px;
  position: absolute;
  top: -1px;
  left: -1px;
`;

const StyledClose = styled(Close)`
  width: 24px;
  height: 24px;
  padding: 3px;
  padding-right: 10px;
  &:hover {
    background-color: #ebebeb;
  }
`;
const SquareBox = styled.div<{
  backgroundColor?: string;
  borderColor?: string;
}>`
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  position: relative;
  margin-right: 10px;
  background-color: ${(props) =>
    props.backgroundColor ? props.backgroundColor : "transparent"};
  border: ${(props) =>
    props.borderColor
      ? `1.8px solid ${props.borderColor}`
      : "1.8px solid #A9A7A7"};
  border-width: 1.8px;
`;

const Selected = styled.div<{
  isOpen: boolean;
  disabled?: boolean;
  height: string;
  bgColor?: string;
  hasError?: boolean;
  selected?: boolean;
  isLoading?: boolean;
  isMultiSelect?: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[3]}px;
  background: ${(props) => {
    if (props.disabled) {
      return props.theme.colors.dropdown.header.disabledBg;
    } else if (props.hasError) {
      return Colors.FAIR_PINK;
    }
    return props.bgColor || Colors.WHITE;
  }};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: ${(props) => props.height};
  cursor: ${(props) =>
    props.disabled || props.isLoading ? "not-allowed" : "pointer"};
  ${(props) =>
    props.hasError
      ? `.sub-text {
        color: ${props.theme.colors.danger.main} !important;
      }`
      : ""}
  ${(props) =>
    props.hasError
      ? `border: 1px solid ${props.theme.colors.danger.main}`
      : props.isOpen
      ? `border: 1px solid ${
          !!props.bgColor
            ? props.bgColor
            : "var(--appsmith-input-focus-border-color)"
        }`
      : props.disabled
      ? `border: 1px solid ${props.theme.colors.dropdown.header.disabledBg}`
      : `border: 1px solid ${!!props.bgColor ? props.bgColor : Colors.ALTO2}`};
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
              : props.selected
              ? props.theme.colors.dropdown.selected.text
              : props.theme.colors.dropdown.header.text
          }`};
  }
  &:hover {
    background: ${(props) =>
      !props.isMultiSelect
        ? props.hasError
          ? Colors.FAIR_PINK
          : props.theme.colors.dropdown.hovered.bg
        : Colors.WHITE}
`;

export const DropdownContainer = styled.div<{ width: string; height?: string }>`
  width: ${(props) => props.width};
  height: ${(props) => props.height || `auto`};
  position: relative;
  span.bp3-popover-target {
    display: inline-block;
    width: 100%;
  }

  span.bp3-popover-wrapper {
    width: 100%;
  }

  &:focus-visible ${Selected} {
    border: 1px solid var(--appsmith-input-focus-border-color);
  }
`;

const DropdownSelect = styled.div``;

export const DropdownWrapper = styled.div<{
  width: string;
  isOpen: boolean;
}>`
  width: ${(props) => props.width};
  height: fit-content;
  z-index: 1;
  background-color: ${(props) => props.theme.colors.dropdown.menu.bg};
  border: 1px solid ${(props) => props.theme.colors.dropdown.menu.border};
  padding: ${(props) => props.theme.spaces[3]}px 0;
  overflow: hidden;
  display: ${(props) => (props.isOpen ? "inline-block" : "none")};
  .dropdown-search {
    margin: 4px 12px 8px;
    width: calc(100% - 24px);

    input {
      height: 36px;
      font-size: 14px !important;
      color: ${Colors.GREY_10} !important;
      padding-left: 36px !important;

      &:focus {
        border: 1.2px solid ${Colors.GREEN_1};
        box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2};
      }
    }

    .bp3-icon-search {
      width: 36px;
      height: 36px;
      margin: 0px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 14px;
      }
    }
  }
`;

const SearchComponentWrapper = styled.div`
  margin: 0px 5px;
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
  overflow-x: hidden;
`;

const OptionWrapper = styled.div<{
  selected: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  min-height: 36px;
  background-color: ${(props) => (props.selected ? Colors.GREEN_3 : null)};
  &&& svg {
    rect {
      fill: ${(props) => props.theme.colors.dropdownIconBg};
    }
  }

  .bp3-popover-wrapper {
    width: 100%;
  }

  .${Classes.TEXT} {
    color: ${(props) =>
      props.selected
        ? props.theme.colors.dropdown.menu.hoverText
        : props.theme.colors.dropdown.menu.text};
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
    background-color: ${Colors.GREEN_3};

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.dropdown.menu.hoverText};
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

const StyledSubText = styled(Text)<{
  showDropIcon?: boolean;
}>`
  margin-left: auto;
  && {
    color: ${(props) => props.theme.colors.dropdown.menu.subText};
  }
  &.sub-text {
    color: ${(props) => props.theme.colors.dropdown.selected.subtext};
    text-align: end;
    margin-right: ${(props) => `${props.theme.spaces[4]}px`};
  }
`;

const LeftIconWrapper = styled.span`
  font-size: 20px;
  line-height: 19px;
  margin-right: 10px;
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
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  width: 100%;

  & ${Text} {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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

  svg {
    path {
      fill: ${(props) =>
        props.fillColor
          ? props.fillColor
          : props.theme.colors.dropdown.selected.icon};
    }
  }
`;

const DropdownIcon = styled(Icon)`
  margin-right: 7px;
  svg {
    fill: ${(props) =>
      props.fillColor ? props.fillColor : props.theme.colors.dropdown.icon};
  }
`;

const ErrorMsg = styled.span`
  ${(props) => getTypographyByKey(props, "p3")};
  color: ${Colors.POMEGRANATE2};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const HelperMsg = styled.span`
  ${(props) => getTypographyByKey(props, "p3")};
  color: ${(props) => props.theme.colors.dropdown.menu.subText};
  margin: 6px 0px 10px;
`;

const ErrorLabel = styled.span`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.POMEGRANATE2};
`;

const StyledText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function TooltipWrappedText(
  props: TextProps & {
    label: string;
  },
) {
  const { label, ...textProps } = props;
  const targetRef = useRef<HTMLDivElement | null>(null);
  return (
    <Tooltip
      boundary="window"
      content={label}
      disabled={!isEllipsisActive(targetRef.current)}
      position={Position.TOP}
    >
      <StyledText ref={targetRef} {...textProps}>
        {label}
      </StyledText>
    </Tooltip>
  );
}

function DefaultDropDownValueNode({
  hasError,
  hideSubText,
  isMultiSelect,
  optionWidth,
  placeholder,
  renderNode,
  selected,
  selectedOptionClickHandler,
  showDropIcon,
  showLabelOnly,
}: DefaultDropDownValueNodeProps) {
  const LabelText =
    !Array.isArray(selected) && selected
      ? showLabelOnly
        ? selected.label
        : selected.value
      : placeholder
      ? placeholder
      : "Please select a option.";

  function Label() {
    if (isMultiSelect && Array.isArray(selected) && selected.length) {
      return (
        <div style={{ display: "flex", width: "100%", flexWrap: "wrap" }}>
          {selected?.map((s: DropdownOption) => {
            return (
              <div
                key={s.value}
                style={{
                  border: "1.2px solid #E0DEDE",
                  display: "flex",
                  alignItems: "center",
                  lineHeight: "19px",
                  margin: "2px 2px",
                }}
              >
                <span style={{ padding: "3px" }}>
                  <Text type={TextType.P1}>{s.label}</Text>
                </span>
                <StyledClose
                  onClick={(event: any) => {
                    event.stopPropagation();
                    if (selectedOptionClickHandler) {
                      selectedOptionClickHandler(s as DropdownOption);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    } else
      return hasError ? (
        <ErrorLabel>{LabelText}</ErrorLabel>
      ) : (
        <span style={{ width: "100%" }}>
          <Text type={TextType.P1}>{LabelText}</Text>
        </span>
      );
  }

  return (
    <SelectedDropDownHolder>
      {renderNode ? (
        renderNode({
          isSelectedNode: true,
          option: selected,
          hasError,
          optionWidth,
        })
      ) : isMultiSelect && Array.isArray(selected) && selected.length ? (
        <Label />
      ) : (
        !Array.isArray(selected) && (
          <>
            {selected?.icon ? (
              <SelectedIcon
                fillColor={hasError ? Colors.POMEGRANATE2 : selected?.iconColor}
                hoverFillColor={
                  hasError ? Colors.POMEGRANATE2 : selected?.iconColor
                }
                name={selected.icon}
                size={selected.iconSize || IconSize.XL}
              />
            ) : null}
            <Label />
            {selected?.subText && !hideSubText ? (
              <StyledSubText
                className="sub-text"
                showDropIcon={showDropIcon}
                type={TextType.P1}
              >
                {selected.subText}
              </StyledSubText>
            ) : null}
          </>
        )
      )}
    </SelectedDropDownHolder>
  );
}

interface DropdownOptionsProps extends DropdownProps, DropdownSearchProps {
  optionClickHandler: (option: DropdownOption) => void;
  selectedOptionClickHandler: (option: DropdownOption) => void;
  renderOption?: RenderOption;
  headerLabel?: string;
  selected: DropdownOption | DropdownOption[];
  optionWidth: string;
  isMultiSelect?: boolean;
  isOpen: boolean; // dropdown popover options flashes when closed, this prop helps to make sure it never happens again.
}

export function RenderDropdownOptions(props: DropdownOptionsProps) {
  const { onSearch, optionClickHandler, optionWidth, renderOption } = props;
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
  const theme = useTheme() as Theme;

  return (
    <DropdownWrapper
      className="ads-dropdown-options-wrapper"
      isOpen={props.isOpen}
      width={optionWidth}
    >
      {props.enableSearch && (
        <SearchComponentWrapper>
          <SearchComponent
            onSearch={onOptionSearch}
            placeholder={props.searchPlaceholder || ""}
            value={searchValue}
          />
        </SearchComponentWrapper>
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
              optionWidth,
            });
          }
          let isSelected = false;
          if (
            props.isMultiSelect &&
            Array.isArray(props.selected) &&
            props.selected.length
          ) {
            isSelected = !!props.selected.find(
              (selectedOption) => selectedOption.value === option.value,
            );
          } else {
            isSelected =
              (props.selected as DropdownOption).value === option.value;
          }
          return !option.isSectionHeader ? (
            <OptionWrapper
              aria-selected={isSelected}
              className="t--dropdown-option"
              key={index}
              onClick={
                // users should be able to unselect a selected option by clicking the option again.
                isSelected
                  ? () => props.selectedOptionClickHandler(option)
                  : () => props.optionClickHandler(option)
              }
              role="option"
              selected={isSelected}
            >
              {option.leftElement && (
                <LeftIconWrapper>{option.leftElement}</LeftIconWrapper>
              )}
              {option.icon ? (
                <SelectedIcon
                  fillColor={option?.iconColor}
                  hoverFillColor={option?.iconColor}
                  name={option.icon}
                  size={option.iconSize || IconSize.XL}
                />
              ) : null}
              {props.isMultiSelect ? (
                isSelected ? (
                  <SquareBox backgroundColor="#f86a2b" borderColor="#f86a2b">
                    <StyledCheckmark />
                  </SquareBox>
                ) : (
                  <SquareBox borderColor="#a9a7a7" />
                )
              ) : null}
              {props.showLabelOnly ? (
                props.truncateOption ? (
                  <TooltipWrappedText
                    label={option.label || ""}
                    type={TextType.P1}
                  />
                ) : (
                  <Text type={TextType.P1}>{option.label}</Text>
                )
              ) : option.label && option.value ? (
                <LabelWrapper className="label-container">
                  <Text type={TextType.H5}>{option.value}</Text>
                  <Text type={TextType.P1}>{option.label}</Text>
                </LabelWrapper>
              ) : props.truncateOption ? (
                <TooltipWrappedText
                  label={option.value || ""}
                  type={TextType.P1}
                />
              ) : (
                <Text type={TextType.P1}>{option.value}</Text>
              )}
              {option.subText ? (
                <StyledSubText type={TextType.P3}>
                  {option.subText}
                </StyledSubText>
              ) : null}
            </OptionWrapper>
          ) : (
            <SegmentHeader
              style={{ paddingRight: theme.spaces[5] }}
              title={option.label || ""}
            />
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
    placeholder,
    helperText,
    removeSelectedOption,
    hasError,
    closeOnSpace = true,
  } = { ...props };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<DropdownOption | DropdownOption[]>(
    props.selected,
  );

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
      if (props.isMultiSelect) {
        // Multi select -> typeof selected is array of objects
        if (isArray(selected) && selected.length < 1) {
          setSelected([option]);
        } else {
          const newOptions: DropdownOption[] = [
            ...(selected as DropdownOption[]),
            option,
          ];
          setSelected(newOptions);
        }
      } else {
        // Single select -> typeof selected is object
        setSelected(option);
      }
      setIsOpen(false);
      onSelect && onSelect(option.value, option);
      option.onSelect && option.onSelect(option.value, option);
    },
    [onSelect],
  );

  //Removes selected option
  const selectedOptionClickHandler = useCallback(
    (optionToBeRemoved: DropdownOption) => {
      setIsOpen(false);
      const selectedOptions = (selected as DropdownOption[]).filter(
        (option: DropdownOption) => option.value !== optionToBeRemoved.value,
      );
      setSelected(selectedOptions);
      removeSelectedOption &&
        removeSelectedOption(optionToBeRemoved.value, optionToBeRemoved);
    },
    [removeSelectedOption],
  );

  const errorFlag = hasError || errorMsg.length > 0;
  const disabled = props.disabled || isLoading;
  const downIconColor = errorFlag ? Colors.POMEGRANATE2 : Colors.DARK_GRAY;

  const onClickHandler = () => {
    if (!props.disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (isOpen) {
            setSelected((prevSelected) => {
              if (prevSelected != props.selected) return props.selected;
              return prevSelected;
            });
            setIsOpen(false);
            e.nativeEvent.stopImmediatePropagation();
          }
          break;
        case " ":
          if (closeOnSpace) {
            e.preventDefault();
            if (isOpen && !("length" in selected)) optionClickHandler(selected);
            else onClickHandler();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (isOpen && !("length" in selected)) optionClickHandler(selected);
          else onClickHandler();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setSelected((prevSelected) => {
              if (!("length" in prevSelected)) {
                let index = findIndex(props.options, prevSelected);
                if (index === 0) index = props.options.length - 1;
                else index--;
                return props.options[index];
              }
              return prevSelected;
            });
          } else {
            onClickHandler();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (isOpen) {
            setSelected((prevSelected) => {
              if (!("length" in prevSelected)) {
                let index = findIndex(props.options, prevSelected);
                if (index === props.options.length - 1) index = 0;
                else index++;
                return props.options[index];
              }
              return prevSelected;
            });
          } else {
            onClickHandler();
          }
          break;
        case "Tab":
          if (isOpen) {
            setIsOpen(false);
          }
          break;
      }
    },
    [isOpen, props.options, props.selected, selected],
  );

  const [dropdownWrapperWidth, setDropdownWrapperWidth] = useState<string>(
    "100%",
  );

  const dropdownWrapperRef = useCallback(
    (ref: HTMLDivElement) => {
      if (ref) {
        const { width } = ref.getBoundingClientRect();
        setDropdownWrapperWidth(`${width}px`);
      }
    },
    [setDropdownWrapperWidth],
  );

  const dropdownOptionWidth = props.fillOptions
    ? dropdownWrapperWidth
    : props.optionWidth || "260px";

  const dropdownTrigger = props.dropdownTriggerIcon ? (
    <DropdownTriggerWrapper
      disabled={props.disabled}
      isOpen={isOpen}
      onClick={onClickHandler}
      ref={dropdownWrapperRef}
    >
      {props.dropdownTriggerIcon}
    </DropdownTriggerWrapper>
  ) : (
    <DropdownSelect ref={dropdownWrapperRef}>
      <Selected
        bgColor={props.bgColor}
        className={props.className}
        disabled={props.disabled}
        hasError={errorFlag}
        height={props.height || "38px"}
        isMultiSelect={props.isMultiSelect}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        selected={!!selected}
      >
        <SelectedValueNode
          hasError={errorFlag}
          hideSubText={props.hideSubText}
          isMultiSelect={props.isMultiSelect}
          optionWidth={dropdownOptionWidth}
          placeholder={placeholder}
          renderNode={renderOption}
          selected={selected}
          selectedOptionClickHandler={selectedOptionClickHandler}
          showDropIcon={showDropIcon}
          showLabelOnly={props.showLabelOnly}
        />
        {isLoading ? (
          <Spinner size={IconSize.LARGE} />
        ) : (
          showDropIcon && (
            <DropdownIcon
              fillColor={downIconColor}
              hoverFillColor={downIconColor}
              name={props.defaultIcon || "expand-more"}
              size={IconSize.XXL}
            />
          )
        )}
      </Selected>
      {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
      {helperText && !isOpen && !errorMsg && (
        <HelperMsg>{helperText}</HelperMsg>
      )}
    </DropdownSelect>
  );

  const dropdownWidth = props.width || "260px";

  return (
    <DropdownContainer
      className={props.containerClassName + " " + replayHighlightClass}
      data-cy={props.cypressSelector}
      height={"38px"}
      onKeyDown={handleKeydown}
      role="listbox"
      tabIndex={0}
      width={dropdownWidth}
    >
      <Popover
        boundary={props.boundary || "scrollParent"}
        isOpen={isOpen && !disabled}
        minimal
        modifiers={{ arrow: { enabled: true } }}
        onInteraction={(state) => !disabled && setIsOpen(state)}
        popoverClassName={`${props.className} none-shadow-popover`}
        position={Position.BOTTOM_LEFT}
        usePortal={!props.dontUsePortal}
      >
        {dropdownTrigger}
        <RenderDropdownOptions
          {...props}
          isMultiSelect={props.isMultiSelect}
          isOpen={isOpen}
          optionClickHandler={optionClickHandler}
          optionWidth={dropdownOptionWidth}
          selected={selected ? selected : { id: undefined, value: undefined }}
          selectedOptionClickHandler={selectedOptionClickHandler}
        />
      </Popover>
    </DropdownContainer>
  );
}
