/* eslint-disable no-console */
import React, { useEffect, useState, useCallback, useRef } from "react";
import Select, { SelectProps } from "rc-select";
import { DraftValueType } from "rc-select/lib/Select";
import {
  DropdownStyles,
  MultiSelectContainer,
  StyledCheckbox,
} from "./index.styled";
import {
  CANVAS_SELECTOR,
  MODAL_PORTAL_CLASSNAME,
  TextSize,
} from "constants/WidgetConstants";
import debounce from "lodash/debounce";
import { Icon } from "design-system";
import { Alignment, Classes } from "@blueprintjs/core";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import _ from "lodash";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import LabelWithTooltip from "widgets/components/LabelWithTooltip";

const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <StyledCheckbox checked={props.isSelected} />;
};

export interface MultiSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "options" | "placeholder" | "loading" | "dropdownStyle"
    >
  > {
  mode?: "multiple" | "tags";
  value: string[];
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
  isValid: boolean;
  allowSelectAll?: boolean;
  widgetId: string;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
  isDynamicHeightEnabled?: boolean;
}

const DEBOUNCE_TIMEOUT = 800;

function MultiSelectComponent({
  allowSelectAll,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  isDynamicHeightEnabled,
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
  serverSideFiltering,
  value,
  width,
}: MultiSelectProps): JSX.Element {
  const [isSelectAll, setIsSelectAll] = useState(false);

  const _menu = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (
      !isSelectAll &&
      options.length &&
      value.length &&
      options.length === value.length
    ) {
      setIsSelectAll(true);
    }
    if (isSelectAll && options.length !== value.length) {
      setIsSelectAll(false);
    }
  }, [options, value]);

  const getDropdownPosition = useCallback(() => {
    const node = _menu.current;
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    return document.querySelector(`.${CANVAS_SELECTOR}`) as HTMLElement;
  }, []);

  const handleSelectAll = () => {
    if (!isSelectAll) {
      const allOption = options.map((option) => option.value) as string[];
      onChange(allOption);
      return;
    }
    return onChange([]);
  };

  const dropdownRender = useCallback(
    (
      menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => (
      <div className={loading ? Classes.SKELETON : ""}>
        {options.length && allowSelectAll ? (
          <StyledCheckbox
            alignIndicator="left"
            checked={isSelectAll}
            className={`all-options ${isSelectAll ? "selected" : ""}`}
            label="Select all"
            onChange={handleSelectAll}
          />
        ) : null}
        {menu}
      </div>
    ),
    [isSelectAll, options, loading, allowSelectAll],
  );

  // Convert the values to string before searching.
  // input is always a string.
  const filterOption = useCallback(
    (input, option) =>
      String(option?.props.label)
        .toLowerCase()
        .indexOf(input.toLowerCase()) >= 0 ||
      String(option?.props.value)
        .toLowerCase()
        .indexOf(input.toLowerCase()) >= 0,
    [],
  );

  const onClose = useCallback((open) => !open && onFilterChange(""), []);

  const serverSideSearch = React.useMemo(() => {
    const updateFilter = (filterValue: string) => {
      onFilterChange(filterValue);
    };
    return debounce(updateFilter, DEBOUNCE_TIMEOUT);
  }, []);

  const id = _.uniqueId();
  return (
    <MultiSelectContainer
      className={loading ? Classes.SKELETON : ""}
      compactMode={compactMode}
      data-testid="multiselect-container"
      isValid={isValid}
      labelPosition={labelPosition}
      ref={_menu as React.RefObject<HTMLDivElement>}
    >
      <DropdownStyles
        dropDownWidth={dropDownWidth}
        id={id}
        parentWidth={width - WidgetContainerDiff}
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
          isDynamicHeightEnabled={isDynamicHeightEnabled}
          loading={loading}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <Select
        animation="slide-up"
        // TODO: Make Autofocus a variable in the property pane
        // autoFocus
        choiceTransitionName="rc-select-selection__choice-zoom"
        className="rc-select"
        disabled={disabled}
        dropdownClassName={`multi-select-dropdown multiselect-popover-width-${id}`}
        dropdownRender={dropdownRender}
        dropdownStyle={dropdownStyle}
        filterOption={serverSideFiltering ? false : filterOption}
        getPopupContainer={getDropdownPosition}
        inputIcon={
          <Icon
            className="dropdown-icon"
            fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
            name="dropdown"
          />
        }
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        menuItemSelectedIcon={menuItemSelectedIcon}
        mode="multiple"
        notFoundContent="No Results Found"
        onBlur={onBlur}
        onChange={onChange}
        onDropdownVisibleChange={onClose}
        onFocus={onFocus}
        onSearch={serverSideSearch}
        options={options}
        placeholder={placeholder || "select option(s)"}
        removeIcon={
          <Icon
            className="remove-icon"
            fillColor={Colors.GREY_10}
            name="close-x"
          />
        }
        showArrow
        value={value}
      />
    </MultiSelectContainer>
  );
}

export default MultiSelectComponent;
