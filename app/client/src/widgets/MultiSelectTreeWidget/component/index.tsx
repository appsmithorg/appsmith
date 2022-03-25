import React, {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TreeSelect, { TreeSelectProps as SelectProps } from "rc-tree-select";
import {
  TreeSelectContainer,
  DropdownStyles,
  StyledIcon,
  StyledLabel,
  TextLabelWrapper,
  StyledTooltip,
  InputContainer,
} from "./index.styled";
import "rc-tree-select/assets/index.less";
import { DefaultValueType } from "rc-tree-select/lib/interface";
import { TreeNodeProps } from "rc-tree-select/lib/TreeNode";
import { CheckedStrategy } from "rc-tree-select/lib/utils/strategyUtil";
import {
  CANVAS_CLASSNAME,
  MODAL_PORTAL_CLASSNAME,
  TextSize,
} from "constants/WidgetConstants";
import {
  Alignment,
  Button,
  Classes,
  InputGroup,
  Position,
} from "@blueprintjs/core";

import {
  addLabelTooltipEventListeners,
  hasLabelEllipsis,
  removeLabelTooltipEventListeners,
  WidgetContainerDiff,
} from "widgets/WidgetUtils";
import Icon from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";

export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      | "disabled"
      | "placeholder"
      | "loading"
      | "dropdownStyle"
      | "allowClear"
      | "options"
    >
  > {
  value?: DefaultValueType;
  onChange: (value?: DefaultValueType, labelList?: ReactNode[]) => void;
  expandAll: boolean;
  mode: CheckedStrategy;
  labelText: string;
  labelAlignment?: Alignment;
  labelPosition?: LabelPosition;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
  dropDownWidth: number;
  width: number;
  isValid: boolean;
  filterText?: string;
  widgetId: string;
  isFilterable: boolean;
}

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
const FOCUS_TIMEOUT = 500;

function MultiTreeSelectComponent({
  allowClear,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  expandAll,
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
  mode,
  onChange,
  options,
  placeholder,
  value,
  widgetId,
  width,
}: TreeSelectProps): JSX.Element {
  const [key, setKey] = useState(Math.random());
  const [isLabelTooltipEnabled, setIsLabelTooltipEnabled] = useState(false);
  const [isLabelTooltipOpen, setIsLabelTooltipOpen] = useState(false);
  const [filter, setFilter] = useState(filterText ?? "");

  const _menu = useRef<HTMLElement | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // treeDefaultExpandAll is uncontrolled after first render,
  // using this to force render to respond to changes in expandAll
  useEffect(() => {
    setKey(Math.random());
  }, [expandAll]);

  useEffect(() => {
    if (labelText && !isLabelTooltipEnabled) {
      addLabelTooltipEventListeners(
        `.appsmith_widget_${widgetId} .multitree-select-label`,
        handleMouseEnterOnLabel,
        handleMouseLeaveOnLabel,
      );
      setIsLabelTooltipEnabled(true);
    } else if (!labelText && isLabelTooltipEnabled) {
      setIsLabelTooltipEnabled(false);
    }
  }, [labelText]);

  useEffect(() => {
    return () =>
      removeLabelTooltipEventListeners(
        `.appsmith_widget_${widgetId} .multitree-select-label`,
        handleMouseEnterOnLabel,
        handleMouseLeaveOnLabel,
      );
  }, []);

  const handleMouseEnterOnLabel = useCallback(() => {
    if (
      hasLabelEllipsis(`.appsmith_widget_${widgetId} .multitree-select-label`)
    ) {
      setIsLabelTooltipOpen(true);
    }
  }, []);

  const handleMouseLeaveOnLabel = useCallback(() => {
    setIsLabelTooltipOpen(false);
  }, []);

  const clearButton = useMemo(
    () =>
      filter ? (
        <Button icon="cross" minimal onClick={() => setFilter("")} />
      ) : null,
    [filter],
  );

  const getDropdownPosition = useCallback(() => {
    const node = _menu.current;
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    return document.querySelector(`.${CANVAS_CLASSNAME}`) as HTMLElement;
  }, []);
  const onQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setFilter(event.target.value);
  }, []);

  const memoDropDownWidth = useMemo(() => {
    if (compactMode && labelRef.current) {
      const labelWidth = labelRef.current.clientWidth;
      const widthDiff = dropDownWidth - labelWidth;
      return widthDiff > dropDownWidth ? widthDiff : dropDownWidth;
    }
    const parentWidth = width - WidgetContainerDiff;
    return parentWidth > dropDownWidth ? parentWidth : dropDownWidth;
  }, [compactMode, dropDownWidth, width, labelRef.current]);
  const dropdownRender = useCallback(
    (
      menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => (
      <>
        {isFilterable ? (
          <InputGroup
            autoFocus
            inputRef={inputRef}
            leftIcon="search"
            onChange={onQueryChange}
            onKeyDown={(e) => e.stopPropagation()}
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

  const onOpen = useCallback((open: boolean) => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), FOCUS_TIMEOUT);
    }
  }, []);

  const onClear = useCallback(() => onChange([], []), []);

  return (
    <TreeSelectContainer
      allowClear={allowClear}
      compactMode={compactMode}
      data-testid="multitreeselect-container"
      isValid={isValid}
      labelPosition={labelPosition}
      ref={_menu as React.RefObject<HTMLDivElement>}
    >
      <DropdownStyles dropDownWidth={memoDropDownWidth} id={widgetId} />
      {labelText && (
        <TextLabelWrapper
          alignment={labelAlignment}
          compactMode={compactMode}
          position={labelPosition}
          ref={labelRef}
          width={labelWidth}
        >
          <StyledTooltip
            content={labelText}
            hoverOpenDelay={200}
            isOpen={isLabelTooltipOpen}
            position={Position.TOP}
          >
            <StyledLabel
              $compactMode={compactMode}
              $disabled={disabled}
              $labelStyle={labelStyle}
              $labelText={labelText}
              $labelTextColor={labelTextColor}
              $labelTextSize={labelTextSize}
              className={`multitree-select-label ${
                loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
              }`}
              disabled={disabled}
            >
              {labelText}
            </StyledLabel>
          </StyledTooltip>
        </TextLabelWrapper>
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
          getPopupContainer={getDropdownPosition}
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
          notFoundContent="No Results Found"
          onChange={onChange}
          onClear={onClear}
          onDropdownVisibleChange={onOpen}
          placeholder={placeholder}
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
