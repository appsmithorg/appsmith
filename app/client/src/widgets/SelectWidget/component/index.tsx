import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { Classes } from "@blueprintjs/core";
import { DropdownOption } from "../constants";
import {
  IItemListRendererProps,
  IItemRendererProps,
} from "@blueprintjs/select";
import { debounce, findIndex, isEmpty, isNil, isNumber } from "lodash";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import { FixedSizeList } from "react-window";
import { TextSize } from "constants/WidgetConstants";
import {
  StyledLabel,
  TextLabelWrapper,
  StyledControlGroup,
  StyledSingleDropDown,
  DropdownStyles,
  DropdownContainer,
  MenuItem,
} from "./index.styled";
import Fuse from "fuse.js";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import SelectButton from "./SelectButton";
import { labelMargin } from "../../WidgetUtils";

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["label", "value"],
};

const DEBOUNCE_TIMEOUT = 800;
const ITEM_SIZE = 40;
const MAX_RENDER_MENU_ITEMS_HEIGHT = 300;

interface SelectComponentState {
  activeItemIndex: number | undefined;
  query?: string;
  isOpen?: boolean;
}

class SelectComponent extends React.Component<
  SelectComponentProps,
  SelectComponentState
> {
  listRef: any = React.createRef();
  labelRef = React.createRef<HTMLDivElement>();
  spanRef = React.createRef<HTMLSpanElement>();

  state = {
    // used to show focused item for keyboard up down key interection
    activeItemIndex: -1,
    query: "",
    isOpen: false,
  };

  componentDidMount = () => {
    // set default selectedIndex as focused index
    this.setState({ activeItemIndex: this.props.selectedIndex });
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

  togglePopoverVisibility = () => {
    this.setState({ isOpen: !this.state.isOpen });
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
    // If Popover is open, then toggle visibility.
    // Required when item selection is made via keyboard input.
    if (this.state.isOpen) this.togglePopoverVisibility();
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
    this.props.onFilterChange(filterValue);
    this.listRef?.current?.scrollTo(0);
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
    if (!this.state.isOpen) return null;
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    // For tabbable menuItems
    const isFocused = itemProps.modifiers.active;
    const focusClassName = `${isFocused && "has-focus"}`;
    const selectedClassName = `${isSelected && "menu-item-active"}`;
    return (
      <MenuItem key={option.value} onClick={itemProps.handleClick}>
        <a
          className={`menu-item-link ${selectedClassName} ${focusClassName}`}
          tabIndex={0}
        >
          <div className="menu-item-text">{option.label}</div>
        </a>
      </MenuItem>
    );
  };
  handleCancelClick = (event: React.MouseEvent<Element, MouseEvent>) => {
    event.stopPropagation();
    this.onItemSelect({});
  };
  handleCloseList = () => {
    if (this.state.isOpen) {
      this.togglePopoverVisibility();
      if (!this.props.selectedIndex) return;
      return this.handleActiveItemChange(
        this.props.options[this.props.selectedIndex],
      );
    }
  };
  noResultsUI = (
    <MenuItem>
      <a className="menu-item-link">
        <div className="menu-item-text">No Results Found</div>
      </a>
    </MenuItem>
  );
  itemListRenderer = (
    props: IItemListRendererProps<any>,
  ): JSX.Element | null => {
    if (!this.state.isOpen) return null;
    let activeItemIndex = this.props.selectedIndex || null;
    if (props.activeItem && activeItemIndex === null) {
      activeItemIndex = props.filteredItems?.findIndex(
        (item) => item.value === props.activeItem?.value,
      );
    }
    if (!props.filteredItems || !props.filteredItems.length)
      return this.noResultsUI;
    return this.renderList(
      props.filteredItems,
      activeItemIndex,
      props.renderItem,
    );
  };
  menuListStyle = { height: "auto", maxHeight: MAX_RENDER_MENU_ITEMS_HEIGHT };
  renderList = (
    items: DropdownOption[],
    activeItemIndex: number | null,
    renderItem: (item: any, index: number) => JSX.Element | null,
  ): JSX.Element | null => {
    // Don't scroll if the list is filtered.
    const optionsCount = this.props.options.length;
    const scrollOffset: number =
      !this.state.query &&
      isNumber(activeItemIndex) &&
      optionsCount * ITEM_SIZE > MAX_RENDER_MENU_ITEMS_HEIGHT
        ? activeItemIndex * ITEM_SIZE
        : 0;
    const RowRenderer = (itemProps: any) => (
      <div key={itemProps.index} style={itemProps.style}>
        {renderItem(items[itemProps.index], itemProps.index)}
      </div>
    );
    return (
      <FixedSizeList
        className="menu-virtual-list"
        height={MAX_RENDER_MENU_ITEMS_HEIGHT}
        initialScrollOffset={scrollOffset}
        itemCount={items.length}
        itemSize={ITEM_SIZE}
        ref={this.listRef}
        style={this.menuListStyle}
        width={"100%"}
      >
        {RowRenderer}
      </FixedSizeList>
    );
  };

  getDropdownWidth = () => {
    const parentWidth = this.props.width - WidgetContainerDiff;
    if (this.props.compactMode && this.labelRef.current) {
      const labelWidth = this.labelRef.current.getBoundingClientRect().width;
      const widthDiff = parentWidth - labelWidth - labelMargin;
      return widthDiff > this.props.dropDownWidth
        ? widthDiff
        : this.props.dropDownWidth;
    }
    return parentWidth > this.props.dropDownWidth
      ? parentWidth
      : this.props.dropDownWidth;
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
    const tooltipText: string =
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
            itemListRenderer={this.itemListRenderer}
            itemRenderer={this.renderSingleSelectItem}
            items={this.props.options}
            noResults={this.noResultsUI}
            onActiveItemChange={this.handleActiveItemChange}
            onItemSelect={this.onItemSelect}
            onQueryChange={this.onQueryChange}
            popoverProps={{
              boundary: "window",
              isOpen: this.state.isOpen,
              minimal: true,
              usePortal: true,
              onClose: this.handleCloseList,
              // onActiveItemChange is called twice abd puts the focus on the first item https://github.com/palantir/blueprint/issues/4192
              onOpening: () => {
                if (!this.props.selectedIndex) {
                  return this.handleActiveItemChange(null);
                }
                return this.handleActiveItemChange(
                  this.props.options[this.props.selectedIndex],
                );
              },
              modifiers: {
                preventOverflow: {
                  enabled: false,
                },
              },
              popoverClassName: `select-popover-wrapper select-popover-width-${this.props.widgetId}`,
            }}
            query={this.state.query}
            scrollToActiveItem
            value={this.props.value as string}
          >
            <SelectButton
              disabled={disabled}
              displayText={value}
              handleCancelClick={this.handleCancelClick}
              spanRef={this.spanRef}
              togglePopoverVisibility={this.togglePopoverVisibility}
              tooltipText={tooltipText}
              value={this.props.value}
            />
          </StyledSingleDropDown>
        </StyledControlGroup>
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
