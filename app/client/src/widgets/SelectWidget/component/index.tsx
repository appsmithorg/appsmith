import React, { useMemo } from "react";
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
import { IPopoverProps } from "@blueprintjs/select/node_modules/@blueprintjs/core";

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

interface SelectButtonProps {
  disabled?: boolean;
  displayText?: string;
  handleCancelClick?: (event: React.MouseEvent<Element, MouseEvent>) => void;
  value?: string;
}

function SelectButton(props: SelectButtonProps) {
  const { disabled, displayText, handleCancelClick, value } = props;
  return useMemo(
    () => (
      <Button
        disabled={disabled}
        rightIcon={
          <StyledDiv>
            {!isEmptyOrNill(value) ? (
              <Icon
                className="dropdown-icon cancel-icon"
                fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
                name="cross"
                onClick={handleCancelClick}
                size={IconSize.XXS}
              />
            ) : null}
            <Icon
              className="dropdown-icon"
              fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
              name="dropdown"
            />
          </StyledDiv>
        }
        text={displayText}
      />
    ),
    [disabled, displayText, handleCancelClick, value],
  );
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
    if (
      prevProps.selectedIndex !== this.props.selectedIndex &&
      this.state.activeItemIndex !== this.props.selectedIndex
    ) {
      // update focus index if selectedIndex changed by property pane
      this.setState({ activeItemIndex: this.props.selectedIndex });
    }
  };

  handleActiveItemChange = (activeItem: DropdownOption | null) => {
    // Update state.activeItemIndex if activeItem is different from the current value
    if (
      activeItem?.value !==
      this.props?.options[this.state.activeItemIndex]?.value
    ) {
      // find new index from options
      const activeItemIndex = findIndex(this.props.options, [
        "label",
        activeItem?.label,
      ]);
      this.setState({ activeItemIndex });
    }
  };

  itemListPredicate(query: string, items: DropdownOption[]) {
    if (!query) return items;
    const fuse = new Fuse(items, FUSE_OPTIONS);
    return fuse.search(query);
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    if (this.props.value) return selectedOption.value === this.props.value;
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
    const className = `single-select ${isFocused && "is-focused"}`;
    return (
      <MenuItem
        active={isSelected}
        className={className}
        key={option.value}
        onClick={itemProps.handleClick}
        tabIndex={0}
        text={option.label}
      />
    );
  };
  handleCancelClick = (event: React.MouseEvent<Element, MouseEvent>) => {
    event.stopPropagation();
    this.onItemSelect({});
  };
  handleCloseList = () => {
    if (!this.props.selectedIndex) return;
    return this.handleActiveItemChange(
      this.props.options[this.props.selectedIndex],
    );
  };
  noResultsUI = (<MenuItem disabled text="No Results Found" />);
  popOverProps: Partial<IPopoverProps> = {
    boundary: "window",
    minimal: true,
    usePortal: true,
    onClose: this.handleCloseList,
    modifiers: {
      preventOverflow: {
        enabled: false,
      },
    },
    popoverClassName: `select-popover-wrapper select-popover-width-${this.props.widgetId}`,
  };
  // active focused item
  activeItem = !isEmpty(this.props.options)
    ? this.props.options[this.state.activeItemIndex]
    : undefined;

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
        {!isLoading && (
          <StyledControlGroup fill>
            <StyledSingleDropDown
              activeItem={this.activeItem}
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
              noResults={this.noResultsUI}
              onActiveItemChange={this.handleActiveItemChange}
              onItemSelect={this.onItemSelect}
              onQueryChange={this.onQueryChange}
              popoverProps={this.popOverProps}
              query={this.state.query}
              scrollToActiveItem
              value={this.props.value as string}
            >
              <SelectButton
                disabled={disabled}
                displayText={value}
                handleCancelClick={this.handleCancelClick}
                value={this.props.value}
              />
            </StyledSingleDropDown>
          </StyledControlGroup>
        )}
      </DropdownContainer>
    );
  }
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

export default React.memo(SelectComponent);
