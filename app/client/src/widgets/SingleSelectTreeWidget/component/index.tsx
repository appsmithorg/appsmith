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
import { isNil } from "lodash";

export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "placeholder" | "loading" | "dropdownStyle" | "allowClear"
    >
  > {
  value?: DefaultValueType;
  onChange: (value?: DefaultValueType, labelList?: ReactNode[]) => void;
  expandAll: boolean;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
  labelStyle?: string;
  labelTooltip?: string;
  compactMode: boolean;
  dropDownWidth: number;
  width: number;
  isValid: boolean;
  isDynamicHeightEnabled: boolean;
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

function SingleSelectTreeComponent({
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

  const labelRef = useRef<HTMLDivElement>(null);
  const _menu = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [memoDropDownWidth, setMemoDropDownWidth] = useState(0);

  const { BackDrop, getPopupContainer, isOpen, onKeyDown, onOpen, selectRef } =
    useDropdown({
      inputRef,
      renderMode,
      onDropdownOpen,
      onDropdownClose,
    });

  // treeDefaultExpandAll is uncontrolled after first render,
  // using this to force render to respond to changes in expandAll
  useEffect(() => {
    setKey(Math.random());
  }, [expandAll]);

  const onSelectionChange = useCallback(
    (value?: DefaultValueType, labelList?: ReactNode[]) => {
      if (value !== undefined) {
        setFilter("");
        onChange(value, labelList);
      }
    },
    [],
  );
  const onClear = useCallback(() => onChange("", []), []);
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

  const onDropdownVisibleChange = (open: boolean) => {
    onOpen(open);
    // Clear the search input on closing the widget
    setFilter("");
  };
  const allowClearMemo = useMemo(
    () => allowClear && !isNil(value) && value !== "",
    [allowClear, value],
  );

  const memoValue = useMemo(() => (value !== "" ? value : undefined), [value]);

  return (
    <TreeSelectContainer
      accentColor={accentColor}
      allowClear={allowClear}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      compactMode={compactMode}
      data-testid="treeselect-container"
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
          className={`tree-select-label`}
          color={labelTextColor}
          compact={compactMode}
          cyHelpTextClassName="tree-select-tooltip"
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
          allowClear={allowClearMemo}
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
          dropdownClassName={`tree-select-dropdown single-tree-select-dropdown treeselect-popover-width-${widgetId}`}
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
          notFoundContent={
            <NoDataFoundContainer>No Results Found</NoDataFoundContainer>
          }
          onChange={onSelectionChange}
          onClear={onClear}
          onDropdownVisibleChange={onDropdownVisibleChange}
          open={isOpen}
          placeholder={placeholder}
          ref={selectRef}
          searchValue={filter}
          showArrow
          showSearch={false}
          style={{ width: "100%" }}
          switcherIcon={switcherIcon}
          transitionName="rc-tree-select-dropdown-slide-up"
          treeData={options}
          treeDefaultExpandAll={expandAll}
          treeIcon
          treeNodeFilterProp="label"
          value={memoValue}
        />
      </InputContainer>
    </TreeSelectContainer>
  );
}

export default SingleSelectTreeComponent;
