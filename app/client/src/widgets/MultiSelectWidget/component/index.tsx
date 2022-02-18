/* eslint-disable no-console */
import React, { useEffect, useState, useCallback, useRef } from "react";
import Select, { SelectProps } from "rc-select";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import {
  DropdownStyles,
  MultiSelectContainer,
  StyledCheckbox,
  TextLabelWrapper,
  StyledLabel,
  StyledTooltip,
} from "./index.styled";
import {
  CANVAS_CLASSNAME,
  MODAL_PORTAL_CLASSNAME,
  TextSize,
} from "constants/WidgetConstants";
import debounce from "lodash/debounce";
import Icon from "components/ads/Icon";
import { Alignment, Classes, Position } from "@blueprintjs/core";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import _ from "lodash";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";

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
  onChange: (value: DefaultValueType) => void;
  serverSideFiltering: boolean;
  onFilterChange: (text: string) => void;
  dropDownWidth: number;
  width: number;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
  isValid: boolean;
  allowSelectAll?: boolean;
  widgetId: string;
}

const DEBOUNCE_TIMEOUT = 800;

function MultiSelectComponent({
  allowSelectAll,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  isValid,
  labelAlignment,
  labelPosition,
  labelStyle,
  labelText,
  labelTextColor,
  labelTextSize,
  labelWidth,
  loading,
  onChange,
  onFilterChange,
  options,
  placeholder,
  serverSideFiltering,
  value,
  widgetId,
  width,
}: MultiSelectProps): JSX.Element {
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [hasLabelEllipsis, setHasLabelEllipsis] = useState(false);

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

  useEffect(() => {
    setHasLabelEllipsis(checkHasLabelEllipsis());
  }, [width, labelText, labelPosition, labelWidth]);

  const checkHasLabelEllipsis = useCallback(() => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${widgetId} .tree-multiselect-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  }, []);

  const getDropdownPosition = useCallback(() => {
    const node = _menu.current;
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    return document.querySelector(`.${CANVAS_CLASSNAME}`) as HTMLElement;
  }, []);

  const handleSelectAll = () => {
    if (!isSelectAll) {
      const allOption: string[] = options.map((option) => option.value);
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
  console.log("dropDownWidth", dropDownWidth);
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
        <TextLabelWrapper
          alignment={labelAlignment}
          compactMode={compactMode}
          position={labelPosition}
          width={labelWidth}
        >
          {hasLabelEllipsis ? (
            <StyledTooltip
              content={labelText}
              hoverOpenDelay={200}
              position={Position.TOP}
            >
              <StyledLabel
                $compactMode={compactMode}
                $disabled={disabled}
                $labelStyle={labelStyle}
                $labelText={labelText}
                $labelTextColor={labelTextColor}
                $labelTextSize={labelTextSize}
                className={`multiselect-label ${
                  loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
                }`}
              >
                {labelText}
              </StyledLabel>
            </StyledTooltip>
          ) : (
            <StyledLabel
              $compactMode={compactMode}
              $disabled={disabled}
              $labelStyle={labelStyle}
              $labelText={labelText}
              $labelTextColor={labelTextColor}
              $labelTextSize={labelTextSize}
              className={`multiselect-label ${
                loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
              }`}
            >
              {labelText}
            </StyledLabel>
          )}
        </TextLabelWrapper>
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
        onChange={onChange}
        onDropdownVisibleChange={onClose}
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
