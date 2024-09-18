import type { ReactElement } from "react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import type { IconName } from "../Icon";
import Icon, { IconSize } from "../Icon";
import type { CommonComponentProps } from "../types/common";
import { SubTextPosition, DSEventTypes, emitDSEvent } from "../types/common";
import { Classes, replayHighlightClass } from "../constants/classes";
import type { TextProps } from "../Text";
import Text, { TextType } from "../Text";
import type { PopperBoundary } from "@blueprintjs/core";
import { Popover, Position } from "@blueprintjs/core";
import { typography } from "../constants/typography";
import styled from "styled-components";
import SearchComponent from "../SearchComponent";
import Spinner from "../Spinner";
import Tooltip from "../Tooltip";
import SegmentHeader from "../ListSegmentHeader";
import { debounce, isArray } from "lodash";
import "./styles.css";
import { importSvg } from "../utils/icon-loadables";

const Check = importSvg(
  async () => import("../assets/icons/control/checkmark.svg"),
);

export type DropdownOnSelect = (
  value?: string,
  dropdownOption?: any,
  isUpdatedViaKeyboard?: boolean,
) => void;

export interface DropdownOption {
  label?: string;
  value?: string;
  id?: string;
  icon?: IconName;
  leftElement?: string;
  searchText?: string;
  subText?: string;
  subTextPosition?: SubTextPosition;
  iconSize?: IconSize;
  iconColor?: string;
  onSelect?: DropdownOnSelect;
  data?: any;
  isSectionHeader?: boolean;
  disabled?: boolean;
  disabledTooltipText?: string;
  hasCustomBadge?: boolean;
  link?: string;
}

export interface DropdownSearchProps {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: any) => void;
  searchAutoFocus?: boolean;
}

export interface RenderDropdownOptionType {
  index?: number;
  option: DropdownOption | DropdownOption[];
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
  isSelectedNode?: boolean;
  extraProps?: any;
  hasError?: boolean;
  optionWidth: string;
  isHighlighted?: boolean;
}

export type RenderOption = ({
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
    labelRenderer?: (selected: Partial<DropdownOption>[]) => JSX.Element;
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
    wrapperBgColor?: string;
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
    allowDeselection?: boolean; //prevents de-selection of the selected option
    truncateOption?: boolean; // enabled wrapping and adding tooltip on option item of dropdown menu
    portalClassName?: string;
    portalContainer?: HTMLElement;
    customBadge?: JSX.Element;
    selectedHighlightBg?: string;
    showEmptyOptions?: boolean;
  };
export interface DefaultDropDownValueNodeProps {
  selected: DropdownOption | DropdownOption[];
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<DropdownOption>[]) => JSX.Element;
  isMultiSelect?: boolean;
  isOpen?: boolean;
  hasError?: boolean;
  renderNode?: RenderOption;
  removeSelectedOptionClickHandler?: (option: DropdownOption) => void;
  placeholder?: string;
  showDropIcon?: boolean;
  optionWidth: string;
  hideSubText?: boolean;
}

export interface RenderDropdownOptionType {
  option: DropdownOption | DropdownOption[];
  optionClickHandler?: (dropdownOption: DropdownOption) => void;
}

/**
 * checks if ellipsis is active
 * this function is meant for checking the existence of ellipsis by CSS.
 * Since ellipsis by CSS are not part of DOM, we are checking with scroll width\height and offsetidth\height.
 * ScrollWidth\ScrollHeight is always greater than the offsetWidth\OffsetHeight when ellipsis made by CSS is active.
 * Using clientWidth to fix this https://stackoverflow.com/a/21064102/8692954
 * @param element
 */
const isEllipsisActive = (element: HTMLElement | null) => {
  return element && element.clientWidth < element.scrollWidth;
};

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
      border: 1px solid var(--ads-dropdown-default-dropdown-trigger-border-color);
    `
      : null};
  .${Classes.TEXT} {
    ${(props) =>
      props.disabled
        ? `color: var(--ads-dropdown-disabled-header-text-color)`
        : `color: var(--ads-dropdown-default-header-text-color)`};
  }
`;

const StyledIcon = styled(Icon)`
  width: 18px;
  height: 18px;
  &:hover {
    background-color: var(--ads-dropdown-default-close-hover-background-color);
  }
`;
const SquareBox = styled.div<{
  checked: boolean;
  backgroundColor?: string;
  borderColor?: string;
}>`
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  margin-right: 10px;
  background-color: ${(props) => {
    if (props.backgroundColor) return props.backgroundColor;

    props.checked ? "var(--ads-color-black-900)" : "var(--ads-color-black-0)";
  }};
  border: 1.4px solid;
  border-color: ${(props) => {
    if (props.borderColor) return props.borderColor;

    props.checked ? "var(--ads-color-black-900)" : "var(--ads-color-black-400)";
  }};
  flex: 0 0 auto;
  & svg {
    display: ${(props) => (props.checked ? "block" : "none")};
    width: 14px;
    height: 14px;

    & path {
      fill: var(--ads-color-brand-text);
    }
  }
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
  padding: var(--ads-spaces-2) var(--ads-spaces-3);
  background: ${(props) => {
    if (props.disabled) {
      return "var(--ads-dropdown-disabled-header-background-color)";
    } else if (props.hasError) {
      return "var(--ads-old-color-fair-pink)";
    }

    return props.bgColor || "var(--ads-color-black-0)";
  }};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: ${(props) => props.height};
  ${(props) =>
    props.isMultiSelect &&
    `
    min-height: 36px;
    padding: 4px 8px;
  `}
  cursor: ${(props) =>
    props.disabled || props.isLoading ? "not-allowed" : "pointer"};
  ${(props) =>
    props.hasError
      ? `.sub-text {
        color: var(--ads-danger-main) !important;
      }`
      : ""}
  ${(props) =>
    props.hasError
      ? `border: 1px solid var(--ads-danger-main)`
      : props.isOpen
        ? `border: 1px solid ${
            !!props.bgColor
              ? props.bgColor
              : "var(--appsmith-input-focus-border-color)"
          }`
        : props.disabled
          ? `border: 1px solid var(--ads-dropdown-disabled-header-background-color)`
          : `border: 1px solid ${
              !!props.bgColor ? props.bgColor : "var(--ads-color-black-250)"
            }`};
  .${Classes.TEXT} {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: calc(100% - 10px);
    ${(props) =>
      props.disabled
        ? `color: var(--ads-dropdown-disabled-header-text-color)`
        : `color: ${
            !!props.bgColor
              ? "var(--ads-color-black-0)"
              : props.selected
                ? "var(--ads-dropdown-selected-header-text-color)"
                : "var(--ads-dropdown-default-header-text-color)"
          }`};
  }
  &:hover {
    background: ${(props) =>
      !props.isMultiSelect
        ? props.hasError
          ? "var(--ads-old-color-fair-pink)"
          : "var(--ads-dropdown-hover-background-color)"
        : "var(--ads-color-black-0)"};
  }
`;

export const DropdownContainer = styled.div<{
  disabled?: boolean;
  width: string;
  height?: string;
}>`
  width: ${(props) => props.width};
  height: ${(props) => props.height || `auto`};
  position: relative;
  ${({ disabled }) => (disabled ? "cursor: not-allowed;" : "")}
  span.bp3-popover-target {
    display: inline-block;
    width: 100%;
    height: 100%;
  }
  span.bp3-popover-target div {
    height: 100%;
  }
  span.bp3-popover-wrapper {
    width: 100%;
  }
  &:focus ${Selected} {
    ${({ disabled }) =>
      !disabled
        ? "border: 1px solid var(--appsmith-input-focus-border-color);"
        : ""};
  }

  ${({ disabled }) => {
    if (disabled) {
      return `
        &:focus {
          outline: none;
        }
      `;
    }
  }}
`;

const DropdownSelect = styled.div``;

export const DropdownWrapper = styled.div<{
  width: string;
  isOpen: boolean;
  wrapperBgColor?: string;
}>`
  width: ${(props) => props.width};
  z-index: 1;
  background-color: ${(props) =>
    props.wrapperBgColor ? props.wrapperBgColor : "var(--ads-color-black-0)"};
  border: 1px solid var(--ads-dropdown-default-menu-border-color);
  overflow: hidden;
  overflow-y: auto;
  box-shadow:
    0px 12px 16px -4px rgba(0, 0, 0, 0.1),
    0px 4px 6px -2px rgba(0, 0, 0, 0.05);
  display: ${(props) => (props.isOpen ? "inline-block" : "none")};
  .dropdown-search {
    width: 100%;
    input {
      height: 32px;
      font-size: 14px !important;
      color: var(--ads-old-color-gray-10) !important;
      padding-left: 36px !important;
      border: 1.2px solid var(--ads-color-black-200);
      &:hover {
        background: var(--ads-color-black-50);
      }
      &:focus {
        color: var(--ads-color-black-900);
        border: 1.2px solid var(--ads-color-black-900);
      }
    }
    .bp3-icon-search {
      width: 32px;
      height: 32px;
      margin: 0px;
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 14px;
        path {
          fill: var(--ads-color-black-700);
        }
      }
    }
  }
`;

const SearchComponentWrapper = styled.div`
  padding: 8px;
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
  .ds--dropdown-tooltip > span {
    width: 100%;
    &:focus {
      outline: none;
    }
    & > .t--dropdown-option:focus {
      outline: none;
    }
  }
  .ds--dropdown-tooltip {
    &:focus {
      outline: none;
    }
  }
`;

const StyledSubText = styled(Text)<{
  showDropIcon?: boolean;
  subTextPosition?: SubTextPosition;
}>`
  ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM
      ? "margin-top: 3px"
      : "margin-left: auto"};
  &&& {
    color: var(--ads-dropdown-default-menu-subtext-text-color);
  }
  &.sub-text {
    color: var(--ads-dropdown-selected-menu-subtext-text-color);
    text-align: end;
    margin-right: var(--ads-spaces-4);
  }
`;

const OptionWrapper = styled.div<{
  disabled?: boolean;
  selected: boolean;
  subTextPosition?: SubTextPosition;
  selectedHighlightBg?: string;
}>`
  padding: calc(var(--ads-spaces-3) + 1px) var(--ads-spaces-5);
  ${(props) => (!props.disabled ? "cursor: pointer" : "")};
  display: flex;
  width: 100%;
  min-height: 36px;
  flex-direction: ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM ? "column" : "row"};
  align-items: ${(props) =>
    props.subTextPosition === SubTextPosition.BOTTOM ? "flex-start" : "center"};
  background-color: ${(props) =>
    props.selected
      ? props.selectedHighlightBg || `var(--ads-color-black-200)`
      : "var(--ads-color-black-0)"};
  &&& svg {
    rect {
      fill: var(--ads-color-black-250);
    }
  }
  .bp3-popover-wrapper {
    width: 100%;
  }
  .${Classes.TEXT} {
    color: ${(props) =>
      props.disabled
        ? "var(--ads-color-black-470)"
        : props.selected
          ? "var(--ads-dropdown-default-menu-hover-text-color)"
          : "var(--ads-dropdown-default-menu-text-color)"};
  }
  .${Classes.ICON} {
    margin-right: var(--ads-spaces-5);
    svg {
      path {
        ${(props) =>
          props.selected
            ? `fill: var(--ads-dropdown-default-icon-selected-fill-color)`
            : `fill: var(--ads-dropdown-default-icon-default-fill-color)`};
      }
    }
  }
  &:hover,
  &.highlight-option {
    background-color: ${(props) =>
      props.selectedHighlightBg ||
      "var(--ads-dropdown-default-menu-hover-background-color)"};
    &&& svg {
      rect {
        fill: var(--ads-text-color-on-dark-background);
      }
    }
    .${Classes.TEXT} {
      color: var(--ads-dropdown-default-menu-hover-text-color);
    }
    ${StyledSubText} {
      color: var(--ads-dropdown-default-menu-subtext-text-color);
    }
    .${Classes.ICON} {
      svg {
        path {
          fill: var(--ads-dropdown-default-icon-hover-fill-color);
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
    margin-top: calc(var(--ads-spaces-2) - 1px);
  }
  &:hover {
    .${Classes.TEXT} {
      color: var(--ads-dropdown-selected-text-color);
    }
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
  color: var(--ads-old-color-dove-gray);
  font-size: 10px;
  padding: 0px 7px 7px 7px;
`;

const SelectedDropDownHolder = styled.div<{ enableScroll?: boolean }>`
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  overflow: ${(props) => (props.enableScroll ? "auto" : "hidden")};
  width: 100%;
  & ${Text} {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &.custom-render-option > * {
    // below if to override any custom margin and padding added in the render option
    // because the above container already comes with a padding
    // which will result broken UI
    margin: 0 !important;
    padding: 0 !important;
    & > *:hover {
      background-color: initial;
      background: initial;
    }
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
        fill: var(--ads-dropdown-default-icon-background-color);
        rx: 0;
      }
      path {
        fill: var(--ads-property-pane-default-label-fill-color);
      }
    }
  }
  svg {
    path {
      fill: ${(props) =>
        props.fillColor
          ? props.fillColor
          : "var(--ads-dropdown-default-icon-selected-fill-color)"};
    }
  }
`;

const DropdownIcon = styled(Icon)`
  svg {
    fill: ${(props) =>
      props.fillColor
        ? props.fillColor
        : "var(--ads-dropdown-default-icon-fill-color)"};
  }
`;

const ErrorMsg = styled.span`
  font-weight: ${typography["p3"].fontWeight};
  font-size: ${typography["p3"].fontSize}px;
  line-height: ${typography["p3"].lineHeight}px;
  letter-spacing: ${typography["p3"].letterSpacing}px;
  color: var(--ads-old-color-pomegranate);
  margin-top: var(--ads-spaces-3);
`;

const HelperMsg = styled.span`
  font-weight: ${typography["p3"].fontWeight};
  font-size: ${typography["p3"].fontSize}px;
  line-height: ${typography["p3"].lineHeight}px;
  letter-spacing: ${typography["p3"].letterSpacing}px;
  color: var(--ads-dropdown-default-menu-subtext-text-color);
  margin: 6px 0px 10px;
`;

const ErrorLabel = styled.span`
  font-weight: ${typography["p1"].fontWeight};
  font-size: ${typography["p1"].fontSize}px;
  line-height: ${typography["p1"].lineHeight}px;
  letter-spacing: ${typography["p1"].letterSpacing}px;
  color: var(--ads-old-color-pomegranate);
`;

const StyledText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChipsWrapper = styled.div`
  display: flex;
`;

const Chips = styled.div`
  display: flex;
  height: 24px;
  align-items: center;
  padding: 4px;
  margin-right: 8px;
  background-color: var(--ads-color-black-100);
  & > span[type="p2"] {
    margin-right: 4px;
  }
`;

const EmptyStateWrapper = styled.div`
  padding: 8px;
  background-color: var(--ads-color-black-100);
  display: flex;
  flex-direction: column;
  justify-content: center;
  & > span {
    color: var(--ads-color-black-500);
  }
`;

const scrollIntoViewOptions: ScrollIntoViewOptions = {
  block: "nearest",
};

function emitKeyPressEvent(element: HTMLDivElement | null, key: string) {
  emitDSEvent(element, {
    component: "Dropdown",
    event: DSEventTypes.KEYPRESS,
    meta: {
      key,
    },
  });
}

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
      position="top"
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
  labelRenderer,
  optionWidth,
  placeholder,
  removeSelectedOptionClickHandler,
  renderNode,
  selected,
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
        : "Please select an option.";

  function Label() {
    if (isMultiSelect && Array.isArray(selected) && selected.length) {
      return !labelRenderer ? (
        <ChipsWrapper>
          {selected?.map((s: DropdownOption) => {
            return (
              <Chips key={s.value}>
                <Text type={TextType.P2}>{s.label}</Text>
                <StyledIcon
                  className={`t--remove-option-${s.label}`}
                  fillColor="var(--ads-old-color-gray-7)"
                  name="close-x"
                  onClick={(event: any) => {
                    event.stopPropagation();

                    if (removeSelectedOptionClickHandler) {
                      removeSelectedOptionClickHandler(s as DropdownOption);
                    }
                  }}
                  size={IconSize.XXL}
                />
              </Chips>
            );
          })}
        </ChipsWrapper>
      ) : (
        labelRenderer(selected)
      );
    } else
      return hasError ? (
        <ErrorLabel>{LabelText}</ErrorLabel>
      ) : (
        <span style={{ width: "100%", height: "24px", display: "flex" }}>
          <Text
            style={{
              display: "flex",
              alignItems: "center",
            }}
            type={TextType.P1}
          >
            {LabelText}
          </Text>
        </span>
      );
  }

  return (
    <SelectedDropDownHolder
      className={renderNode ? "custom-render-option" : ""}
      enableScroll={isMultiSelect}
    >
      {renderNode ? (
        renderNode({
          isSelectedNode: true,
          option: selected,
          hasError,
          optionWidth,
        })
      ) : isMultiSelect && Array.isArray(selected) ? (
        <Label />
      ) : (
        !Array.isArray(selected) && (
          <>
            {selected?.icon ? (
              <SelectedIcon
                fillColor={
                  hasError
                    ? "var(--ads-old-color-pomegranate)"
                    : selected?.iconColor
                }
                hoverFillColor={
                  hasError
                    ? "var(--ads-old-color-pomegranate)"
                    : selected?.iconColor
                }
                name={selected.icon}
                size={selected.iconSize || IconSize.XL}
              />
            ) : null}
            {selected?.leftElement && (
              <LeftIconWrapper className="left-icon-wrapper">
                {selected.leftElement}
              </LeftIconWrapper>
            )}
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
  removeSelectedOptionClickHandler: (option: DropdownOption) => void;
  renderOption?: RenderOption;
  headerLabel?: string;
  highlightIndex?: number;
  selected: DropdownOption | DropdownOption[];
  optionWidth: string;
  wrapperBgColor?: string;
  isMultiSelect?: boolean;
  allowDeselection?: boolean;
  isOpen: boolean; // dropdown popover options flashes when closed, this prop helps to make sure it never happens again.
  showEmptyOptions?: boolean;
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

  function EmptyState() {
    return (
      <EmptyStateWrapper>
        <Text type={TextType.P1}>No results found</Text>
        {props.enableSearch && (
          <Text type={TextType.P2}>Try to search a different keyword</Text>
        )}
      </EmptyStateWrapper>
    );
  }

  return (
    <DropdownWrapper
      className="ads-dropdown-options-wrapper"
      data-cy="dropdown-options-wrapper"
      // eslint-disable-next-line testing-library/consistent-data-testid
      data-testid="dropdown-options-wrapper"
      isOpen={props.isOpen}
      width={optionWidth}
      wrapperBgColor={props.wrapperBgColor}
    >
      {props.enableSearch && (
        <SearchComponentWrapper className="dropdown-search">
          <SearchComponent
            autoFocus={props.searchAutoFocus}
            onSearch={onOptionSearch}
            placeholder={props.searchPlaceholder || ""}
            value={searchValue}
          />
        </SearchComponentWrapper>
      )}
      {props.headerLabel && <HeaderWrapper>{props.headerLabel}</HeaderWrapper>}
      <DropdownOptionsWrapper
        height={props.dropdownHeight || "100%"}
        id="ds--dropdown-options"
        maxHeight={props.dropdownMaxHeight || "auto"}
      >
        {options.map((option: DropdownOption, index: number) => {
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

          if (renderOption) {
            return renderOption({
              option,
              index,
              optionClickHandler,
              optionWidth,
              isSelectedNode: isSelected,
              isHighlighted: index === props.highlightIndex,
            });
          }

          return !option.isSectionHeader ? (
            <Tooltip
              className="ds--dropdown-tooltip"
              content={
                !!option.disabledTooltipText
                  ? option.disabledTooltipText
                  : "Action not supported"
              }
              disabled={!option.disabled}
              key={`tootltip-${index}`}
              styles={{
                width: "100%",
              }}
            >
              <OptionWrapper
                aria-selected={isSelected}
                className={`t--dropdown-option ${
                  isSelected ? "selected" : ""
                } ${props.highlightIndex === index ? "highlight-option" : ""}`}
                data-cy={`t--dropdown-option-${option?.label}`}
                disabled={option.disabled}
                key={index}
                onClick={
                  // users should be able to unselect a selected option by clicking the option again.
                  isSelected && props.allowDeselection
                    ? () => props.removeSelectedOptionClickHandler(option)
                    : () => props.optionClickHandler(option)
                }
                role="option"
                selected={
                  props.isMultiSelect
                    ? props.highlightIndex === index
                    : isSelected
                }
                selectedHighlightBg={props.selectedHighlightBg}
                subTextPosition={option.subTextPosition ?? SubTextPosition.LEFT}
              >
                {option.leftElement && (
                  <LeftIconWrapper className="left-icon-wrapper">
                    {option.leftElement}
                  </LeftIconWrapper>
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
                    <SquareBox
                      backgroundColor="var(--ads-color-brand)"
                      borderColor="var(--ads-color-brand)"
                      checked={isSelected}
                    >
                      <Check />
                    </SquareBox>
                  ) : (
                    <SquareBox borderColor="#a9a7a7" checked={isSelected} />
                  )
                ) : null}
                {props.showLabelOnly ? (
                  props.truncateOption ? (
                    <>
                      <TooltipWrappedText
                        label={option.label || ""}
                        type={TextType.P1}
                      />
                      {option.hasCustomBadge && props.customBadge}
                    </>
                  ) : (
                    <>
                      <Text type={TextType.P1}>{option.label}</Text>
                      {option.hasCustomBadge && props.customBadge}
                    </>
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
                  <StyledSubText
                    subTextPosition={option.subTextPosition}
                    type={TextType.P3}
                  >
                    {option.subText}
                  </StyledSubText>
                ) : null}
              </OptionWrapper>
            </Tooltip>
          ) : (
            <SegmentHeader
              style={{ paddingRight: "var(--ads-spaces-5)" }}
              title={option.label || ""}
            />
          );
        })}
        {!options.length && <EmptyState />}
      </DropdownOptionsWrapper>
    </DropdownWrapper>
  );
}

export default function Dropdown(props: DropdownProps) {
  const {
    closeOnSpace = true,
    errorMsg = "",
    hasError,
    helperText,
    isLoading = false,
    onSelect,
    placeholder,
    removeSelectedOption,
    renderOption,
    SelectedValueNode = DefaultDropDownValueNode,
    showDropIcon = true,
    wrapperBgColor,
  } = { ...props };
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<DropdownOption | DropdownOption[]>(
    props.selected,
  );
  const [highlight, setHighlight] = useState(-1);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  const closeIfOpen = () => {
    if (isOpen && !props.isMultiSelect) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    setSelected(props.selected);

    if (!props.isMultiSelect) closeIfOpen();
  }, [props.selected]);

  const optionClickHandler = useCallback(
    (option: DropdownOption, isUpdatedViaKeyboard?: boolean) => {
      if (option.disabled) {
        return;
      }

      if (props.isMultiSelect) {
        // Multi select -> typeof selected is array of objects
        if (isArray(selected) && selected.length < 1) {
          setSelected([option]);
        } else if (
          (selected as DropdownOption[])
            .map((x) => x.value)
            .findIndex((x) => option.value === x)
        ) {
          const newOptions: DropdownOption[] = [
            ...(selected as DropdownOption[]),
            option,
          ];

          setSelected(newOptions);
          setIsOpen(true);
        }
      } else {
        // Single select -> typeof selected is object
        setSelected(option);
        setIsOpen(false);
      }

      onSelect && onSelect(option.value, option, isUpdatedViaKeyboard);
      option.onSelect && option.onSelect(option.value, option);
    },
    [onSelect],
  );

  //Removes selected option, should be called when allowDeselection=true
  const removeSelectedOptionClickHandler = useCallback(
    (optionToBeRemoved: DropdownOption) => {
      let selectedOptions: DropdownOption | DropdownOption[] = [];

      if (props.isMultiSelect) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }

      if (!Array.isArray(selected)) {
        if (optionToBeRemoved.value === selected.value) {
          selectedOptions = optionToBeRemoved;
        }
      } else {
        selectedOptions = selected.filter(
          (option: DropdownOption) => option.value !== optionToBeRemoved.value,
        );
      }

      setSelected(selectedOptions);
      removeSelectedOption &&
        removeSelectedOption(optionToBeRemoved.value, optionToBeRemoved);
    },
    [removeSelectedOption],
  );

  const errorFlag = hasError || errorMsg.length > 0;
  const disabled = props.disabled || isLoading;
  const downIconColor = errorFlag
    ? "var(--ads-old-color-pomegranate)"
    : "var(--ads-color-black-450)";

  const onClickHandler = () => {
    if (!props.disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      const elementList = document.getElementById(
        "ds--dropdown-options",
      )?.children;

      if (!elementList || elementList?.length === 0) {
        setHighlight(-1);
      }

      switch (e.key) {
        case "Escape":
          emitKeyPressEvent(dropdownWrapperRef.current, e.key);

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
          if (!isOpen) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);
            onClickHandler();
            break;
          }

          if (!props.enableSearch) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);

            if (closeOnSpace) {
              e.preventDefault();

              if (isOpen) {
                if (highlight !== -1 && elementList) {
                  const optionElement = elementList[highlight] as HTMLElement;
                  const dropdownOptionElement = optionElement.querySelector(
                    ".t--dropdown-option",
                  ) as HTMLElement;

                  dropdownOptionElement &&
                  typeof dropdownOptionElement.click === "function"
                    ? dropdownOptionElement.click()
                    : optionElement.click();
                }
              } else {
                onClickHandler();
              }
            }
          }

          break;
        case "Enter":
          emitKeyPressEvent(dropdownWrapperRef.current, e.key);
          e.preventDefault();

          if (isOpen) {
            if (highlight !== -1 && elementList) {
              const optionElement = elementList[highlight] as HTMLElement;
              const dropdownOptionElement = optionElement.querySelector(
                ".t--dropdown-option",
              ) as HTMLElement;

              dropdownOptionElement &&
              typeof dropdownOptionElement.click === "function"
                ? dropdownOptionElement.click()
                : optionElement.click();
            }
          } else {
            onClickHandler();
          }

          break;
        case "ArrowUp":
          if (!isOpen) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);
            onClickHandler();
            break;
          }

          if (elementList) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);
            e.preventDefault();

            if (highlight === -1) {
              setHighlight(elementList.length - 1);
            } else {
              setHighlight((x) => {
                const index = x - 1 < 0 ? elementList.length - 1 : x - 1;

                elementList[index]?.scrollIntoView(scrollIntoViewOptions);

                return index;
              });
            }
          }

          break;
        case "ArrowDown":
          if (!isOpen) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);
            onClickHandler();
            break;
          }

          if (elementList) {
            emitKeyPressEvent(dropdownWrapperRef.current, e.key);
            e.preventDefault();

            if (highlight === -1) {
              setHighlight(0);
            } else {
              setHighlight((x) => {
                const index = x + 1 > elementList.length - 1 ? 0 : x + 1;

                elementList[index]?.scrollIntoView(scrollIntoViewOptions);

                return index;
              });
            }
          }

          break;
        case "Tab":
          emitKeyPressEvent(
            dropdownWrapperRef.current,
            `${e.shiftKey ? "Shift+" : ""}${e.key}`,
          );

          if (isOpen) {
            setIsOpen(false);
          }

          break;
      }
    },
    [isOpen, props.options, props.selected, selected, highlight],
  );

  const [dropdownWrapperWidth, setDropdownWrapperWidth] =
    useState<string>("100%");

  const prevWidth = useRef(0);

  const onParentResize = useCallback(
    debounce((entries) => {
      requestAnimationFrame(() => {
        if (dropdownWrapperRef.current) {
          const width = entries[0].borderBoxSize?.[0].inlineSize;

          if (typeof width === "number" && width !== prevWidth.current) {
            prevWidth.current = width;
            setDropdownWrapperWidth(`${width}px`);
          }
        }
      });
    }, 300),
    [dropdownWrapperRef.current],
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(onParentResize);

    if (dropdownWrapperRef.current && props.fillOptions)
      resizeObserver.observe(dropdownWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dropdownWrapperRef.current, props.fillOptions]);

  let dropdownHeight = props.isMultiSelect ? "auto" : "36px";

  if (props.height) {
    dropdownHeight = props.height;
  }

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
        height={dropdownHeight}
        isMultiSelect={props.isMultiSelect}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        selected={!!selected}
      >
        <SelectedValueNode
          hasError={errorFlag}
          hideSubText={props.hideSubText}
          isMultiSelect={props.isMultiSelect}
          labelRenderer={props.labelRenderer}
          optionWidth={dropdownOptionWidth}
          placeholder={placeholder}
          removeSelectedOptionClickHandler={removeSelectedOptionClickHandler}
          renderNode={renderOption}
          selected={selected}
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
      {errorMsg && (
        <ErrorMsg className="ads-dropdown-errorMsg">{errorMsg}</ErrorMsg>
      )}
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
      disabled={disabled}
      height={dropdownHeight}
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
        popoverClassName={`${props.className} none-shadow-popover ds--dropdown-popover`}
        portalClassName={props.portalClassName}
        portalContainer={props.portalContainer}
        position={Position.BOTTOM_LEFT}
        usePortal={!props.dontUsePortal}
      >
        {dropdownTrigger}
        <RenderDropdownOptions
          {...props}
          allowDeselection={props.allowDeselection}
          highlightIndex={highlight}
          isMultiSelect={props.isMultiSelect}
          isOpen={isOpen}
          optionClickHandler={optionClickHandler}
          optionWidth={dropdownOptionWidth}
          removeSelectedOptionClickHandler={removeSelectedOptionClickHandler}
          searchAutoFocus={props.enableSearch}
          selected={selected ? selected : { id: undefined, value: undefined }}
          wrapperBgColor={wrapperBgColor}
        />
      </Popover>
    </DropdownContainer>
  );
}
