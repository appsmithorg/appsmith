import React from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import type { Alignment } from "@blueprintjs/core";
import { Classes } from "@blueprintjs/core";
import type { DropdownOption } from "../constants";
import type {
  IItemListRendererProps,
  IItemRendererProps,
} from "@blueprintjs/select";
import { debounce, findIndex, isEmpty, isNil, isNumber } from "lodash";
import equal from "fast-deep-equal/es6";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import { FixedSizeList } from "react-window";
import type { TextSize } from "constants/WidgetConstants";
import {
  StyledControlGroup,
  StyledSingleDropDown,
  DropdownStyles,
  DropdownContainer,
  MenuItem,
  RTLStyleContainer,
} from "./index.styled";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import type { LabelPosition } from "components/constants";
import SelectButton from "./SelectButton";
import { labelMargin } from "../../WidgetUtils";
import LabelWithTooltip from "widgets/components/LabelWithTooltip";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

const DEBOUNCE_TIMEOUT = 800;
const ITEM_SIZE = 40;
const MAX_RENDER_MENU_ITEMS_HEIGHT = 300;

interface SelectComponentState {
  activeItemIndex: number | undefined;
  isOpen?: boolean;
}

class SelectComponent extends React.Component<
  SelectComponentProps,
  SelectComponentState
> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listRef: any = React.createRef();
  labelRef = React.createRef<HTMLDivElement>();
  spanRef = React.createRef<HTMLSpanElement>();

  state = {
    // used to show focused item for keyboard up down key interaction
    // initialize to 0 to highlight first item by default
    activeItemIndex: 0,
    isOpen: false,
  };

  componentDidMount = () => {
    const newState: SelectComponentState = {
      activeItemIndex: this.props.selectedIndex,
    };

    if (this.props.isOpen) {
      newState.isOpen = this.props.isOpen;
    }

    // set default selectedIndex as focused index
    this.setState(newState);
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

  togglePopoverVisibilityFromButton = () => {
    this.togglePopoverVisibility(true);
  };

  togglePopoverVisibility = (isButtonClick = false) => {
    // This is an edge case, this method gets called twice if user closes it by clicking on the `SelectButton`
    // which in turn triggers handleOnDropdownClose twice, to solve we have this exception to tell if click event is from button
    if (isButtonClick && this.state.isOpen) return;

    if (this.state.isOpen) {
      this.handleOnDropdownClose();
    } else {
      this.handleOnDropdownOpen();
    }

    this.setState({ isOpen: !this.state.isOpen });
  };

  handleActiveItemChange = (activeItem: DropdownOption | null) => {
    // If activeItem is null and we have options, default to first item
    if (!activeItem && this.props.options.length > 0) {
      this.setState({ activeItemIndex: 0 });
      return;
    }

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

      if (activeItemIndex !== -1) {
        this.setState({ activeItemIndex });
      }
    }
  };

  itemListPredicate(query: string, items: DropdownOption[]) {
    if (!query) return items;

    const filter = items.filter(
      (item) =>
        item.label?.toString().toLowerCase().includes(query.toLowerCase()) ||
        String(item.value).toLowerCase().includes(query.toLowerCase()),
    );

    return filter;
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);

    // If Popover is open, then toggle visibility.
    // Required when item selection is made via keyboard input.
    if (this.state.isOpen) this.togglePopoverVisibility();
  };

  isOptionSelected = (currentOption: DropdownOption) => {
    // if currentOption is null, then return false
    if (isNil(currentOption)) return false;

    if (this.props.value) return currentOption.value === this.props.value;

    const optionIndex = findIndex(this.props.options, (option) => {
      return option.value === currentOption.value;
    });

    return optionIndex === this.props.selectedIndex;
  };

  onQueryChange = debounce((filterValue: string) => {
    if (equal(filterValue, this.props.filterText)) return;

    this.props.onFilterChange(filterValue);
    this.listRef?.current?.scrollTo(0);
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
      <MenuItem
        accentColor={this.props.accentColor}
        key={option.value}
        onClick={itemProps.handleClick}
      >
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
  handleOnDropdownOpen = () => {
    if (!this.state.isOpen && this.props.onDropdownOpen) {
      this.props.onDropdownOpen();
    }
  };
  handleOnDropdownClose = () => {
    if (this.state.isOpen && this.props.onDropdownClose) {
      this.props.onDropdownClose();
    }
  };
  handleCloseList = () => {
    if (this.state.isOpen) {
      this.togglePopoverVisibility();

      if (!this.props.selectedIndex) return;

      return this.handleActiveItemChange(
        this.props.options[this.props.selectedIndex],
      );
    } else {
      this.handleOnDropdownClose();

      /**
       * Clear the search input on closing the widget
       * and when serverSideFiltering is off
       */
      if (this.props.resetFilterTextOnClose && this.props.filterText?.length) {
        this.onQueryChange("");
      }

      if (this.props.onClose) {
        this.props.onClose();
      }
    }
  };
  noResultsUI = (
    <MenuItem accentColor={this.props.accentColor}>
      <a className="menu-item-link">
        <div className="menu-item-text">No Results Found</div>
      </a>
    </MenuItem>
  );
  itemListRenderer = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderItem: (item: any, index: number) => JSX.Element | null,
  ): JSX.Element | null => {
    // Don't scroll if the list is filtered.
    const optionsCount = this.props.options.length;
    const scrollOffset: number =
      !this.props.filterText &&
      isNumber(activeItemIndex) &&
      optionsCount * ITEM_SIZE > MAX_RENDER_MENU_ITEMS_HEIGHT
        ? activeItemIndex * ITEM_SIZE
        : 0;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RowRenderer = (itemProps: any) => (
      <div key={itemProps.index} style={itemProps.style}>
        {renderItem(items[itemProps.index], itemProps.index)}
      </div>
    );

    return (
      <FixedSizeList
        className="menu-virtual-list"
        direction={this.props.rtl ? "rtl" : "ltr"}
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
      accentColor,
      borderRadius,
      boxShadow,
      compactMode,
      disabled,
      isDynamicHeightEnabled,
      isLoading,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
      labelTooltip,
      labelWidth,
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
        ? value.toString()
        : "";

    return (
      <DropdownContainer
        className={this.props.className}
        compactMode={compactMode}
        data-testid="select-container"
        labelPosition={labelPosition}
        rtl={this.props.rtl}
      >
        {this.props.rtl ? (
          <RTLStyleContainer
            dropdownPopoverContainer={`select-popover-wrapper-${this.props.widgetId}`}
          />
        ) : null}
        <DropdownStyles
          accentColor={accentColor}
          borderRadius={borderRadius}
          dropDownWidth={this.getDropdownWidth()}
          id={widgetId}
        />
        {labelText && (
          <LabelWithTooltip
            alignment={labelAlignment}
            className={`select-label`}
            color={labelTextColor}
            compact={compactMode}
            cyHelpTextClassName="select-tooltip"
            disabled={disabled}
            fontSize={labelTextSize}
            fontStyle={labelStyle}
            helpText={labelTooltip}
            isDynamicHeightEnabled={isDynamicHeightEnabled}
            loading={isLoading}
            position={labelPosition}
            ref={this.labelRef}
            text={labelText}
            width={labelWidth}
          />
        )}
        <StyledControlGroup
          $compactMode={compactMode}
          $isDisabled={disabled}
          $labelPosition={labelPosition}
          fill
        >
          <StyledSingleDropDown
            accentColor={accentColor}
            activeItem={activeItem()}
            borderRadius={borderRadius}
            boxShadow={boxShadow}
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
              portalContainer:
                document.getElementById(CANVAS_ART_BOARD) || undefined,
              boundary: "window",
              isOpen: this.state.isOpen,
              minimal: true,
              usePortal: true,
              onClose: this.handleCloseList,
              // onActiveItemChange is called twice abd puts the focus on the first item https://github.com/palantir/blueprint/issues/4192
              onOpening: () => {
                // If there's no selected index or it's invalid, highlight the first item by default
                if (
                  typeof this.props.selectedIndex === "undefined" ||
                  this.props.selectedIndex < 0
                ) {
                  return this.props.options.length > 0
                    ? this.handleActiveItemChange(this.props.options[0])
                    : undefined;
                }

                // If there's a selected item, highlight it (with bounds checking)
                if (
                  this.props.selectedIndex < this.props.options.length &&
                  this.props.options[this.props.selectedIndex]
                ) {
                  return this.handleActiveItemChange(
                    this.props.options[this.props.selectedIndex],
                  );
                }

                // Fallback to first item if selected index is out of bounds
                return this.props.options.length > 0
                  ? this.handleActiveItemChange(this.props.options[0])
                  : undefined;
              },
              modifiers: {
                preventOverflow: {
                  enabled: false,
                },
              },
              popoverClassName: `select-popover-wrapper select-popover-width-${this.props.widgetId} select-popover-wrapper-${this.props.widgetId}`,
            }}
            query={this.props.filterText}
            resetOnClose={this.props.resetFilterTextOnClose}
            scrollToActiveItem
            value={this.props.value as string}
          >
            <SelectButton
              disabled={disabled}
              displayText={value.toString()}
              handleCancelClick={this.handleCancelClick}
              hideCancelIcon={this.props.hideCancelIcon}
              isRequired={this.props.isRequired}
              spanRef={this.spanRef}
              togglePopoverVisibility={this.togglePopoverVisibilityFromButton}
              tooltipText={tooltipText}
              value={this.props.value?.toString()}
            />
          </StyledSingleDropDown>
        </StyledControlGroup>
      </DropdownContainer>
    );
  }
}

export interface SelectComponentProps extends ComponentProps {
  accentColor?: string;
  borderRadius: string;
  boxShadow?: string;
  className?: string;
  compactMode: boolean;
  disabled?: boolean;
  dropDownWidth: number;
  filterText?: string;
  hasError?: boolean;
  height: number;
  hideCancelIcon?: boolean;
  isDynamicHeightEnabled?: boolean;
  isFilterable: boolean;
  isLoading: boolean;
  isOpen?: boolean;
  isRequired?: boolean;
  isValid: boolean;
  label?: string | number;
  labelAlignment?: Alignment;
  labelPosition?: LabelPosition;
  labelStyle?: string;
  labelText: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelTooltip?: string;
  labelWidth?: number;
  onClose?: () => void;
  onDropdownClose?: () => void;
  onDropdownOpen?: () => void;
  onFilterChange: (text: string) => void;
  onOptionSelected: (optionSelected: DropdownOption) => void;
  options: DropdownOption[];
  placeholder?: string;
  resetFilterTextOnClose?: boolean;
  rtl?: boolean;
  selectedIndex?: number;
  serverSideFiltering: boolean;
  value?: string | number;
  width: number;
}

export default React.memo(SelectComponent);
