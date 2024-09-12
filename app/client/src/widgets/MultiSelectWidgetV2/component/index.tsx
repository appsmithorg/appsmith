/* eslint-disable no-console */
import type { ChangeEvent } from "react";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type { SelectProps } from "rc-select";
import Select from "rc-select";
import type { DraftValueType, LabelInValueType } from "rc-select/lib/Select";
import MenuItemCheckBox, {
  DropdownStyles,
  MultiSelectContainer,
  StyledCheckbox,
  InputContainer,
  RTLStyles,
} from "./index.styled";
import type { RenderMode, TextSize } from "constants/WidgetConstants";
import type { Alignment } from "@blueprintjs/core";
import { Button, Classes, InputGroup } from "@blueprintjs/core";
import { labelMargin, WidgetContainerDiff } from "widgets/WidgetUtils";
import { Colors } from "constants/Colors";
import type { LabelPosition } from "components/constants";
import { uniqBy } from "lodash";
import { Icon } from "@design-system/widgets-old";
import useDropdown from "widgets/useDropdown";
import LabelWithTooltip from "widgets/components/LabelWithTooltip";

const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <MenuItemCheckBox checked={props.isSelected} />;
};

export interface MultiSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "options" | "placeholder" | "loading" | "dropdownStyle"
    >
  > {
  mode?: "multiple" | "tags";
  value: LabelInValueType[];
  onChange: (value: DraftValueType) => void;
  serverSideFiltering: boolean;
  onFilterChange: (text: string) => void;
  dropDownWidth: number;
  width: number;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
  labelTooltip?: string;
  isValid: boolean;
  allowSelectAll?: boolean;
  filterText?: string;
  widgetId: string;
  isFilterable: boolean;
  borderRadius: string;
  boxShadow?: string;
  accentColor?: string;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
  renderMode?: RenderMode;
  isDynamicHeightEnabled?: boolean;
  rtl?: boolean;
}

const DEBOUNCE_TIMEOUT = 1000;

function MultiSelectComponent({
  accentColor,
  allowSelectAll,
  borderRadius,
  boxShadow,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  filterText,
  isDynamicHeightEnabled,
  isFilterable,
  isValid,
  labelAlignment,
  labelPosition,
  labelStyle,
  labelText,
  labelTextColor,
  labelTextSize,
  labelTooltip,
  labelWidth,
  loading,
  onChange,
  onDropdownClose,
  onDropdownOpen,
  onFilterChange,
  options,
  placeholder,
  renderMode,
  rtl,
  serverSideFiltering,
  value,
  widgetId,
  width,
}: MultiSelectProps): JSX.Element {
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [filter, setFilter] = useState(filterText ?? "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [memoDropDownWidth, setMemoDropDownWidth] = useState(0);

  const _menu = useRef<HTMLElement | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { BackDrop, getPopupContainer, isOpen, onKeyDown, onOpen, selectRef } =
    useDropdown({
      inputRef,
      renderMode,
      onDropdownOpen,
      onDropdownClose,
    });

  // SelectAll if all options are in Value
  useEffect(() => {
    if (
      !isSelectAll &&
      filteredOptions.length &&
      value.length &&
      !checkOptionsAndValue().includes(false)
    ) {
      setIsSelectAll(true);
    }
    if (isSelectAll && filteredOptions.length !== value.length) {
      setIsSelectAll(false);
    }
  }, [filteredOptions, value]);

  // Trigger onFilterChange once filter is Updated
  useEffect(() => {
    const timeOutId = setTimeout(
      () => onFilterChange(filter),
      DEBOUNCE_TIMEOUT,
    );
    return () => clearTimeout(timeOutId);
  }, [filter]);

  // Filter options based on serverSideFiltering
  useEffect(
    () => {
      if (serverSideFiltering) {
        return setFilteredOptions(options);
      }
      const filtered = options.filter((option) => {
        return (
          String(option.label).toLowerCase().indexOf(filter.toLowerCase()) >=
            0 ||
          String(option.value).toLowerCase().indexOf(filter.toLowerCase()) >= 0
        );
      });
      setFilteredOptions(filtered);
    },
    serverSideFiltering ? [options] : [filter, options],
  );

  const clearButton = useMemo(
    () =>
      filter ? (
        <Button
          icon="cross"
          minimal
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
            setFilter("");
          }}
        />
      ) : null,
    [filter],
  );

  const handleSelectAll = () => {
    if (!isSelectAll) {
      // Get all options
      const allOption: LabelInValueType[] = filteredOptions.map(
        ({ label, value }) => ({
          value: value || "",
          label,
        }),
      );
      // get unique selected values amongst SelectedAllValue and Value
      const allSelectedOptions = uniqBy([...allOption, ...value], "value").map(
        (val) => ({
          ...val,
          key: val.value,
        }),
      );
      onChange(allSelectedOptions);
      return;
    }
    return onChange([]);
  };

  const checkOptionsAndValue = () => {
    const emptyFalseArr = [false];
    if (value.length === 0 || filteredOptions.length === 0)
      return emptyFalseArr;
    return filteredOptions.map((x) => value.some((y) => y.value === x.value));
  };

  useEffect(() => {
    const parentWidth = width - WidgetContainerDiff;
    if (compactMode && labelRef.current) {
      const labelWidth = labelRef.current.getBoundingClientRect().width;
      const widthDiff = parentWidth - labelWidth - labelMargin;
      setMemoDropDownWidth(
        widthDiff > dropDownWidth ? widthDiff : dropDownWidth,
      );
      return;
    }
    setMemoDropDownWidth(
      parentWidth > dropDownWidth ? parentWidth : dropDownWidth,
    );
  }, [compactMode, dropDownWidth, width, labelText]);

  const onQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setFilter(event.target.value);
  }, []);

  const onDropdownVisibleChange = (open: boolean) => {
    onOpen(open);

    /**
     * Clear the search input on closing the widget
     * and serverSideFiltering is off
     */
    if (!serverSideFiltering) {
      setFilter("");
    }
  };

  const dropdownRender = useCallback(
    (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => (
      <div dir={rtl ? "rtl" : "ltr"}>
        <BackDrop />
        {isFilterable ? (
          <InputGroup
            inputRef={inputRef}
            leftIcon="search"
            onChange={onQueryChange}
            onKeyDown={onKeyDown}
            placeholder="Filter..."
            // ref={inputRef}
            rightElement={clearButton as JSX.Element}
            small
            type="text"
            value={filter}
          />
        ) : null}
        <div className={`${loading ? Classes.SKELETON : ""}`}>
          {filteredOptions.length && allowSelectAll ? (
            <StyledCheckbox
              accentColor={accentColor}
              alignIndicator="left"
              checked={isSelectAll}
              className={`all-options ${isSelectAll ? "selected" : ""}`}
              label="Select all"
              onChange={handleSelectAll}
            />
          ) : null}
          {menu}
        </div>
      </div>
    ),
    [
      isSelectAll,
      filteredOptions,
      loading,
      allowSelectAll,
      isFilterable,
      filter,
      onQueryChange,
      rtl,
    ],
  );

  return (
    <MultiSelectContainer
      accentColor={accentColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      compactMode={compactMode}
      data-testid="multiselect-container"
      isValid={isValid}
      labelPosition={labelPosition}
      ref={_menu as React.RefObject<HTMLDivElement>}
      rtl={rtl}
    >
      {rtl ? (
        <RTLStyles dropdownContainer={`multi-select-dropdown-${widgetId}`} />
      ) : null}
      <DropdownStyles
        accentColor={accentColor}
        borderRadius={borderRadius}
        dropDownWidth={memoDropDownWidth}
        id={widgetId}
      />
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          className={`multiselect-label`}
          color={labelTextColor}
          compact={compactMode}
          cyHelpTextClassName="multiselect-tooltip"
          disabled={disabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          helpText={labelTooltip}
          isDynamicHeightEnabled={isDynamicHeightEnabled}
          loading={loading}
          position={labelPosition}
          ref={labelRef}
          text={labelText}
          width={labelWidth}
        />
      )}
      <InputContainer compactMode={compactMode} labelPosition={labelPosition}>
        <Select
          animation="slide-up"
          choiceTransitionName="rc-select-selection__choice-zoom"
          className="rc-select"
          // TODO: Make Autofocus a variable in the property pane
          // autoFocus
          defaultActiveFirstOption={false}
          disabled={disabled}
          dropdownClassName={`multi-select-dropdown multiselect-popover-width-${widgetId} multi-select-dropdown-${widgetId}`}
          dropdownRender={dropdownRender}
          dropdownStyle={dropdownStyle}
          getPopupContainer={getPopupContainer}
          inputIcon={
            <Icon
              className="dropdown-icon"
              fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
              name="dropdown"
            />
          }
          labelInValue
          listHeight={300}
          loading={loading}
          maxTagCount={"responsive"}
          maxTagPlaceholder={(e) => `+${e.length} more`}
          menuItemSelectedIcon={menuItemSelectedIcon}
          mode="multiple"
          notFoundContent="No Results Found"
          onChange={onChange}
          onDropdownVisibleChange={onDropdownVisibleChange}
          open={isOpen}
          options={filteredOptions}
          placeholder={placeholder || "select option(s)"}
          ref={selectRef}
          removeIcon={
            <Icon
              className="remove-icon"
              fillColor={Colors.GREY_10}
              name="close-x"
            />
          }
          showArrow
          showSearch={false}
          value={value}
        />
      </InputContainer>
    </MultiSelectContainer>
  );
}

export default MultiSelectComponent;
