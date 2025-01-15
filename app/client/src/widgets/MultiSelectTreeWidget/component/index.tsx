import type { ChangeEvent, ReactNode } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TreeSelectProps as SelectProps } from "rc-tree-select";
import TreeSelect from "rc-tree-select";
import {
  TreeSelectContainer,
  DropdownStyles,
  StyledIcon,
  InputContainer,
} from "./index.styled";
import "rc-tree-select/assets/index.less";
import type { DefaultValueType } from "rc-tree-select/lib/interface";
import type { TreeNodeProps } from "rc-tree-select/lib/TreeNode";
import type { CheckedStrategy } from "rc-tree-select/lib/utils/strategyUtil";
import type { DefaultOptionType } from "rc-tree-select/lib/TreeSelect";
import styled from "styled-components";
import type { RenderMode, TextSize } from "constants/WidgetConstants";
import type { Alignment } from "@blueprintjs/core";
import { Button, Classes, InputGroup } from "@blueprintjs/core";
import { labelMargin, WidgetContainerDiff } from "widgets/WidgetUtils";
import { Icon } from "@design-system/widgets-old";
import { Colors } from "constants/Colors";
import type { LabelPosition } from "components/constants";
import useDropdown from "widgets/useDropdown";
import LabelWithTooltip from "widgets/components/LabelWithTooltip";

export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "placeholder" | "loading" | "dropdownStyle" | "allowClear"
    >
  > {
  value?: DefaultValueType;
  onChange: (value?: DefaultValueType, labelList?: ReactNode[]) => void;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
  expandAll: boolean;
  mode: CheckedStrategy;
  labelText: string;
  labelAlignment?: Alignment;
  labelPosition?: LabelPosition;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelTooltip?: string;
  compactMode: boolean;
  dropDownWidth: number;
  width: number;
  isDynamicHeightEnabled?: boolean;
  isValid: boolean;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
  widgetId: string;
  filterText?: string;
  isFilterable: boolean;
  renderMode?: RenderMode;
  options?: DefaultOptionType[];
}

export const NoDataFoundContainer = styled.div`
  text-align: center;
`;

const getSvg = (expanded: boolean) => (
  <i
    style={{
      cursor: "pointer",
      backgroundColor: "transparent",
      display: "inline-flex",
      width: "14px",
      height: "100%",
    }}
  >
    <StyledIcon
      className="switcher-icon"
      expanded={expanded}
      fillColor={Colors.GREY_10}
      name="dropdown"
    />
  </i>
);

const switcherIcon = (treeNode: TreeNodeProps) => {
  if (treeNode.isLeaf) {
    return (
      <i
        style={{
          cursor: "pointer",
          backgroundColor: "white",
          display: "inline-flex",
          width: "14px",
        }}
      />
    );
  }

  return getSvg(treeNode.expanded);
};

function MultiTreeSelectComponent({
  accentColor,
  allowClear,
  borderRadius,
  boxShadow,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  expandAll,
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
  mode,
  onChange,
  onDropdownClose,
  onDropdownOpen,
  options,
  placeholder,
  renderMode,
  value,
  widgetId,
  width,
}: TreeSelectProps): JSX.Element {
  const [key, setKey] = useState(Math.random());
  const [filter, setFilter] = useState(filterText ?? "");

  const _menu = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [memoDropDownWidth, setMemoDropDownWidth] = useState(0);

  const { BackDrop, getPopupContainer, isOpen, onKeyDown, onOpen, selectRef } =
    useDropdown({
      inputRef,
      renderMode,
      onDropdownClose,
      onDropdownOpen,
    });

  // treeDefaultExpandAll is uncontrolled after first render,
  // using this to force render to respond to changes in expandAll
  useEffect(() => {
    setKey(Math.random());
  }, [expandAll]);

  const clearButton = useMemo(
    () =>
      filter ? (
        <Button icon="cross" minimal onClick={() => setFilter("")} />
      ) : null,
    [filter],
  );

  const onQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setFilter(event.target.value);
  }, []);

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
  const dropdownRender = useCallback(
    (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            rightElement={clearButton as JSX.Element}
            small
            type="text"
            value={filter}
          />
        ) : null}
        <div className={`${loading ? Classes.SKELETON : ""}`}>{menu}</div>
      </>
    ),
    [loading, isFilterable, filter, onQueryChange],
  );

  const onClear = useCallback(() => onChange([], []), []);
  const onDropdownVisibleChange = (open: boolean) => {
    onOpen(open);
    // clear the search input on closing the widget
    setFilter("");
  };

  return (
    <TreeSelectContainer
      accentColor={accentColor}
      allowClear={allowClear}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      compactMode={compactMode}
      data-testid="multitreeselect-container"
      isValid={isValid}
      labelPosition={labelPosition}
      ref={_menu}
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
          className={`multitree-select-label`}
          color={labelTextColor}
          compact={compactMode}
          cyHelpTextClassName="multitree-select-tooltip"
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
        <TreeSelect
          allowClear={allowClear}
          animation="slide-up"
          choiceTransitionName="rc-tree-select-selection__choice-zoom"
          className="rc-tree-select"
          clearIcon={
            <Icon
              className="clear-icon"
              fillColor={Colors.GREY_10}
              name="close-x"
            />
          }
          disabled={disabled}
          dropdownClassName={`tree-multiselect-dropdown multiselecttree-popover-width-${widgetId}`}
          dropdownRender={dropdownRender}
          dropdownStyle={dropdownStyle}
          filterTreeNode
          getPopupContainer={getPopupContainer}
          inputIcon={
            <Icon
              className="dropdown-icon"
              fillColor={disabled ? Colors.GREY_7 : Colors.GREY_10}
              name="dropdown"
            />
          }
          key={key}
          loading={loading}
          maxTagCount={"responsive"}
          maxTagPlaceholder={(e) => `+${e.length} more`}
          multiple
          notFoundContent={
            <NoDataFoundContainer>No Results Found</NoDataFoundContainer>
          }
          onChange={onChange}
          onClear={onClear}
          onDropdownVisibleChange={onDropdownVisibleChange}
          open={isOpen}
          placeholder={placeholder}
          ref={selectRef}
          removeIcon={
            <Icon
              className="remove-icon"
              fillColor={Colors.GREY_10}
              name="close-x"
            />
          }
          searchValue={filter}
          showArrow
          showCheckedStrategy={mode}
          showSearch={false}
          style={{ width: "100%" }}
          switcherIcon={switcherIcon}
          transitionName="rc-tree-select-dropdown-slide-up"
          treeCheckable={
            <span className={`rc-tree-select-tree-checkbox-inner`} />
          }
          treeData={options}
          treeDefaultExpandAll={expandAll}
          treeIcon
          treeNodeFilterProp="label"
          value={value}
        />
      </InputContainer>
    </TreeSelectContainer>
  );
}

export default MultiTreeSelectComponent;
