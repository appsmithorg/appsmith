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
} from "./index.styled";
import "rc-tree-select/assets/index.less";
import { DefaultValueType } from "rc-tree-select/lib/interface";
import { TreeNodeProps } from "rc-tree-select/lib/TreeNode";
import {
  CANVAS_CLASSNAME,
  MODAL_PORTAL_CLASSNAME,
  TextSize,
} from "constants/WidgetConstants";
import { Button, Classes, InputGroup } from "@blueprintjs/core";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
import Icon from "components/ads/Icon";
import { Colors } from "constants/Colors";
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
  labelText?: string;
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

function SingleSelectTreeComponent({
  allowClear,
  compactMode,
  disabled,
  dropdownStyle,
  dropDownWidth,
  expandAll,
  filterText,
  isFilterable,
  isValid,
  labelStyle,
  labelText,
  labelTextColor,
  labelTextSize,
  loading,
  onChange,
  options,
  placeholder,
  value,
  widgetId,
  width,
}: TreeSelectProps): JSX.Element {
  const [key, setKey] = useState(Math.random());
  const [filter, setFilter] = useState(filterText ?? "");
  const labelRef = useRef<HTMLDivElement>(null);
  const _menu = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // treeDefaultExpandAll is uncontrolled after first render,
  // using this to force render to respond to changes in expandAll
  useEffect(() => {
    setKey(Math.random());
  }, [expandAll]);

  const getDropdownPosition = useCallback(() => {
    const node = _menu.current;
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    return document.querySelector(`.${CANVAS_CLASSNAME}`) as HTMLElement;
  }, []);
  const onClear = useCallback(() => onChange([], []), []);
  const onOpen = useCallback((open: boolean) => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), FOCUS_TIMEOUT);
    }
  }, []);
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

  return (
    <TreeSelectContainer
      compactMode={compactMode}
      isValid={isValid}
      ref={_menu as React.RefObject<HTMLDivElement>}
    >
      <DropdownStyles dropDownWidth={memoDropDownWidth} id={widgetId} />
      {labelText && (
        <TextLabelWrapper compactMode={compactMode} ref={labelRef}>
          <StyledLabel
            $compactMode={compactMode}
            $disabled={disabled}
            $labelStyle={labelStyle}
            $labelText={labelText}
            $labelTextColor={labelTextColor}
            $labelTextSize={labelTextSize}
            className={`tree-select-label ${
              loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
            }`}
            disabled={disabled}
          >
            {labelText}
          </StyledLabel>
        </TextLabelWrapper>
      )}
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
        dropdownClassName={`tree-select-dropdown single-tree-select-dropdown treeselect-popover-width-${widgetId}`}
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
        notFoundContent="No Results Found"
        onChange={onChange}
        onClear={onClear}
        onDropdownVisibleChange={onOpen}
        placeholder={placeholder}
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
        value={value}
      />
    </TreeSelectContainer>
  );
}

export default SingleSelectTreeComponent;
