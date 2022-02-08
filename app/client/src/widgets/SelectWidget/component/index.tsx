import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { MenuItem, Button, Classes } from "@blueprintjs/core";
import { DropdownOption } from "../constants";
import { IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
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

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["label", "value"],
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
  state = {
    // used to show focused item for keyboard up down key interection
    activeItemIndex: 0,
    query: "",
  };
  componentDidMount = () => {
    // set default selectedIndex as focused index
    this.setState({ activeItemIndex: this.props.selectedIndex ?? 0 });
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
    const activeItemIndex = _.findIndex(this.props.options, [
      "label",
      activeItem?.label,
    ]);
    this.setState({ activeItemIndex });
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
    const activeItem = !_.isEmpty(this.props.options)
      ? this.props.options[this.state.activeItemIndex]
      : undefined;
    // get selected option label from selectedIndex
    const selectedOption =
      !_.isEmpty(this.props.options) &&
      this.props.selectedIndex !== undefined &&
      this.props.selectedIndex > -1
        ? this.props.options[this.props.selectedIndex].label
        : this.props.label;
    // for display selected option, there is no separate option to show placeholder
    const value = selectedOption
      ? selectedOption
      : this.props.placeholder || "-- Select --";

    return (
      <DropdownContainer compactMode={compactMode}>
        <DropdownStyles
          dropDownWidth={this.props.dropDownWidth}
          id={widgetId}
          parentWidth={this.props.width - WidgetContainerDiff}
        />
        {labelText && (
          <TextLabelWrapper compactMode={compactMode}>
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
            activeItem={activeItem}
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
              onClose: () => {
                if (!this.props.selectedIndex) return;
                return this.handleActiveItemChange(
                  this.props.options[this.props.selectedIndex as number],
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
                  {this.props.value ? (
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
              text={value}
            />
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
    const optionIndex = _.findIndex(this.props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === this.props.selectedIndex;
  };
  onQueryChange = (filterValue: string) => {
    this.setState({ query: filterValue });
    if (!this.props.serverSideFiltering) return;
    return this.serverSideSearch(filterValue);
  };
  serverSideSearch = _.debounce((filterValue: string) => {
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
        className={`single-select ${isFocused && "is-focused"}`}
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
