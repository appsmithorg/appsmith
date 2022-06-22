/* eslint-disable no-console */
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  ChangeEvent,
  useMemo,
} from "react";
import Select, { SelectProps } from "rc-select";
import {
  DefaultValueType,
  LabelValueType,
} from "rc-select/lib/interface/generator";
import MenuItemCheckBox, {
  DropdownStyles,
  MultiSelectContainer,
  StyledCheckbox,
  InputContainer,
} from "./index.styled";
import { RenderMode, TextSize } from "constants/WidgetConstants";
import Icon from "components/ads/Icon";
import { Alignment, Button, Classes, InputGroup } from "@blueprintjs/core";
import { labelMargin, WidgetContainerDiff } from "widgets/WidgetUtils";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { uniqBy } from "lodash";
import LabelWithTooltip from "components/ads/LabelWithTooltip";
import useDropdown from "widgets/useDropdown";

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
  value: LabelValueType[];
  onChange: (value: DefaultValueType) => void;
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
  renderMode?: RenderMode;
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
  isFilterable,
  isValid,
  labelAlignment,
  labelPosition,
  labelStyle,
  labelText,
  labelTextColor,
  labelTextSize,
  labelWidth,
  loading,
  onBlur,
  onChange,
  onFilterChange,
  onFocus,
  options,
  placeholder,
  renderMode,
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

  const {
    BackDrop,
    getPopupContainer,
    onKeyDown,
    onOpen,
    selectRef,
  } = useDropdown({
    inputRef,
    renderMode,
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
          String(option.label)
            .toLowerCase()
            .indexOf(filter.toLowerCase()) >= 0 ||
          String(option.value)
            .toLowerCase()
            .indexOf(filter.toLowerCase()) >= 0
        );
      });
      setFilteredOptions(filtered);
    },
    serverSideFiltering ? [options] : [filter, options],
  );

  const clearButton = useMemo(
    () =>
      filter ? (
        <Button icon="cross" minimal onClick={() => setFilter("")} />
      ) : null,
    [filter],
  );

  const handleSelectAll = () => {
    if (!isSelectAll) {
      // Get all options
      const allOption: LabelValueType[] = filteredOptions.map(
        ({ label, value }) => ({
          value,
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

  const dropdownRender = useCallback(
    (
      menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => (
      <>
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
      </>
    ),
    [
      isSelectAll,
      filteredOptions,
      loading,
      allowSelectAll,
      isFilterable,
      filter,
      onQueryChange,
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
    >
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
          disabled={disabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
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
          dropdownClassName={`multi-select-dropdown multiselect-popover-width-${widgetId}`}
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
          onBlur={onBlur}
          onChange={onChange}
          onDropdownVisibleChange={onOpen}
          onFocus={onFocus}
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
