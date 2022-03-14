import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { MenuItem, Button, Classes } from "@blueprintjs/core";
import { DropdownOption } from "../constants";
import { IItemRendererProps } from "@blueprintjs/select";
import { debounce, findIndex, isEmpty, isNil } from "lodash";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import { Colors } from "constants/Colors";
import { TextSize } from "constants/WidgetConstants";
import {
  StyledLabel,
  TextLabelWrapper,
  StyledControlGroup,
  StyledSingleDropDown,
  DropdownStyles,
  DropdownContainer,
  StyledDiv,
} from "./index.styled";
import Fuse from "fuse.js";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import Icon, { IconSize } from "components/ads/Icon";
import { isString } from "../../../utils/helpers";

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["label", "value"],
};

export const isEmptyOrNill = (value: any) => {
  return isNil(value) || (isString(value) && value === "");
};

const DEBOUNCE_TIMEOUT = 800;

interface SelectComponentState {
  activeItemIndex: number | undefined;
  query?: string;
}
class SelectComponent extends React.Component<
  SelectComponentProps,
  SelectComponentState
> {
  labelRef = React.createRef<HTMLDivElement>();
  spanRef = React.createRef<HTMLSpanElement>();

  state = {
    // used to show focused item for keyboard up down key interection
    activeItemIndex: -1,
    query: "",
  };

  componentDidMount = () => {
    // set default selectedIndex as focused index
    this.setState({ activeItemIndex: this.props.selectedIndex });
    this.setState({ query: this.props.filterText });
  };

  componentDidUpdate = (prevProps: SelectComponentProps) => {
    if (prevProps.selectedIndex !== this.props.selectedIndex) {
      // update focus index if selectedIndex changed by property pane
      this.setState({ activeItemIndex: this.props.selectedIndex });
    }
  };

  handleActiveItemChange = (activeItem: DropdownOption | null) => {
    // find new index from options
    const activeItemIndex = findIndex(this.props.options, [
      "label",
      activeItem?.label,
    ]);
    if (activeItemIndex === this.state.activeItemIndex) return;
    this.setState({ activeItemIndex });
  };

  getDropdownWidth = () => {
    const parentWidth = this.props.width - WidgetContainerDiff;
    const dropDownWidth =
      parentWidth > this.props.dropDownWidth
        ? parentWidth
        : this.props.dropDownWidth;
    if (this.props.compactMode && this.labelRef.current) {
      const labelWidth = this.labelRef.current.clientWidth;
      const widthDiff = dropDownWidth - labelWidth;
      return widthDiff > this.props.dropDownWidth
        ? widthDiff
        : this.props.dropDownWidth;
    }
    return dropDownWidth;
  };

  render() {
    const {
      compactMode,
      disabled,
      isLoading,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
      widgetId,
    } = this.props;
    // active focused item
    const activeItem = () => {
      if (
        this.state.activeItemIndex === -1 ||
        isNil(this.state.activeItemIndex)
      )
        return undefined;
      if (!isEmpty(this.props.options))
        return this.props.options[this.state.activeItemIndex];
    };
    // get selected option label from selectedIndex
    const selectedOption =
      !isEmpty(this.props.options) &&
      this.props.selectedIndex !== undefined &&
      this.props.selectedIndex > -1
        ? this.props.options[this.props.selectedIndex].label
        : this.props.label;
    // for display selected option, there is no separate option to show placeholder
    const value =
      !isNil(selectedOption) && selectedOption !== ""
        ? selectedOption
        : this.props.placeholder || "-- Select --";

    // Check if text overflows
    const tooltipText =
      this.spanRef.current?.parentElement &&
      (this.spanRef.current.parentElement.offsetHeight <
        this.spanRef.current.parentElement.scrollHeight ||
        this.spanRef.current.parentElement.offsetWidth <
          this.spanRef.current.parentElement.scrollWidth)
        ? value
        : "";

    return (
      <DropdownContainer compactMode={compactMode}>
        <DropdownStyles dropDownWidth={this.getDropdownWidth()} id={widgetId} />
        {labelText && (
          <TextLabelWrapper compactMode={compactMode} ref={this.labelRef}>
            <StyledLabel
              $compactMode={compactMode}
              $disabled={!!disabled}
              $labelStyle={labelStyle}
              $labelText={labelText}
              $labelTextColor={labelTextColor}
              $labelTextSize={labelTextSize}
              className={`select-label ${
                isLoading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
              }`}
            >
              {labelText}
            </StyledLabel>
          </TextLabelWrapper>
        )}
        <StyledControlGroup fill>
          <StyledSingleDropDown
            activeItem={activeItem()}
            className={isLoading ? Classes.SKELETON : ""}
            disabled={disabled}
            filterable={this.props.isFilterable}
            hasError={this.props.hasError}
            isValid={this.props.isValid}
            itemListPredicate={
              !this.props.serverSideFiltering
                ? this.itemListPredicate
                : undefined
            }
            itemRenderer={this.renderSingleSelectItem}
            items={this.props.options}
            noResults={<MenuItem disabled text="No Results Found" />}
            onActiveItemChange={this.handleActiveItemChange}
            onItemSelect={this.onItemSelect}
            onQueryChange={this.onQueryChange}
            popoverProps={{
              boundary: "window",
              minimal: true,
              usePortal: true,
              // onActiveItemChange is called twice abd puts the focus on the first item https://github.com/palantir/blueprint/issues/4192
              onOpening: () => {
                if (!this.props.selectedIndex) {
                  return this.handleActiveItemChange(null);
                }
                return this.handleActiveItemChange(
                  this.props.options[this.props.selectedIndex],
                );
              },
              onClose: () => {
                if (!this.props.selectedIndex) return;
                return this.handleActiveItemChange(
                  this.props.options[this.props.selectedIndex],
                );
              },
              modifiers: {
                preventOverflow: {
                  enabled: false,
                },
              },
              popoverClassName: `select-popover-wrapper select-popover-width-${widgetId}`,
            }}
            query={this.state.query}
            scrollToActiveItem
            value={this.props.value as string}
          >
            <Button
              disabled={this.props.disabled}
              rightIcon={
                <StyledDiv>
                  {!isEmptyOrNill(this.props.value) ? (
                    <Icon
                      className="dropdown-icon cancel-icon"
                      fillColor={
                        this.props.disabled ? Colors.GREY_7 : Colors.GREY_10
                      }
                      name="cross"
                      onClick={(event) => {
                        event.stopPropagation();
                        this.onItemSelect({});
                      }}
                      size={IconSize.XXS}
                    />
                  ) : null}
                  <Icon
                    className="dropdown-icon"
                    fillColor={
                      this.props.disabled ? Colors.GREY_7 : Colors.GREY_10
                    }
                    name="dropdown"
                  />
                </StyledDiv>
              }
            >
              <span ref={this.spanRef} title={tooltipText}>
                {value}
              </span>
            </Button>
          </StyledSingleDropDown>
        </StyledControlGroup>
      </DropdownContainer>
    );
  }

  itemListPredicate(query: string, items: DropdownOption[]) {
    const fuse = new Fuse(items, FUSE_OPTIONS);
    return query ? fuse.search(query) : items;
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = findIndex(this.props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === this.props.selectedIndex;
  };
  onQueryChange = (filterValue: string) => {
    this.setState({ query: filterValue });
    if (!this.props.serverSideFiltering) return;
    return this.serverSideSearch(filterValue);
  };
  serverSideSearch = debounce((filterValue: string) => {
    this.props.onFilterChange(filterValue);
  }, DEBOUNCE_TIMEOUT);

  renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    // For tabbable menuItems
    const isFocused = itemProps.modifiers.active;
    return (
      <MenuItem
        active={isSelected}
        className={`single-select ${isFocused &&
          !isNil(this.state.activeItemIndex) &&
          this.state.activeItemIndex !== -1 &&
          "is-focused"}`}
        key={option.value}
        onClick={itemProps.handleClick}
        tabIndex={0}
        text={option.label}
      />
    );
  };
}

export interface SelectComponentProps extends ComponentProps {
  disabled?: boolean;
  onOptionSelected: (optionSelected: DropdownOption) => void;
  placeholder?: string;
  labelText?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
  selectedIndex?: number;
  options: DropdownOption[];
  isLoading: boolean;
  isFilterable: boolean;
  isValid: boolean;
  width: number;
  dropDownWidth: number;
  height: number;
  serverSideFiltering: boolean;
  hasError?: boolean;
  onFilterChange: (text: string) => void;
  value?: string;
  label?: string;
  filterText?: string;
}

export default SelectComponent;
