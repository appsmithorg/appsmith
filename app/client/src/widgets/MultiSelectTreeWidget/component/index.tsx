import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import TreeSelect, { TreeSelectProps as SelectProps } from "rc-tree-select";
import {
  TreeSelectContainer,
  DropdownStyles,
  inputIcon,
  StyledLabel,
  TextLabelWrapper,
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
import { Classes } from "@blueprintjs/core";
export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      | "disabled"
      | "options"
      | "placeholder"
      | "loading"
      | "dropdownStyle"
      | "allowClear"
    >
  > {
  value?: DefaultValueType;
  onChange: (value?: DefaultValueType, labelList?: ReactNode[]) => void;
  expandAll: boolean;
  mode: CheckedStrategy;
  labelText?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
}

const getSvg = (style = {}) => (
  <i
    style={{
      cursor: "pointer",
      backgroundColor: "transparent",
      display: "inline-flex",
      width: "10px",
    }}
  >
    <svg
      fill="none"
      height="10"
      style={{ verticalAlign: "-.125em", ...style }}
      viewBox="0 0 10 10"
      width="10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M2.5 9L7.5 5L2.5 1L2.5 9Z"
        fill="#090707"
        ill-rule="evenodd"
      />
    </svg>
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
          width: "10px",
        }}
      />
    );
  }
  return getSvg({ transform: `rotate(${treeNode.expanded ? 90 : 0}deg)` });
};

function MultiTreeSelectComponent({
  allowClear,
  compactMode,
  disabled,
  dropdownStyle,
  expandAll,
  labelStyle,
  labelText,
  labelTextColor,
  labelTextSize,
  loading,
  mode,
  onChange,
  options,
  placeholder,
  value,
}: TreeSelectProps): JSX.Element {
  const [key, setKey] = useState(Math.random());
  const _menu = useRef<HTMLElement | null>(null);

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

  return (
    <TreeSelectContainer
      allowClear={allowClear}
      compactMode={compactMode}
      ref={_menu as React.RefObject<HTMLDivElement>}
    >
      <DropdownStyles />
      {labelText && (
        <TextLabelWrapper compactMode={compactMode}>
          <StyledLabel
            $compactMode={compactMode}
            $labelStyle={labelStyle}
            $labelText={labelText}
            $labelTextColor={labelTextColor}
            $labelTextSize={labelTextSize}
            className={`tree-select-label ${
              loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
            }`}
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
        disabled={disabled}
        dropdownClassName="tree-select-dropdown"
        dropdownStyle={dropdownStyle}
        getPopupContainer={getDropdownPosition}
        inputIcon={inputIcon}
        key={key}
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        multiple
        notFoundContent="No item Found"
        onChange={onChange}
        onClear={onClear}
        placeholder={placeholder}
        showArrow
        showCheckedStrategy={mode}
        showSearch
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
    </TreeSelectContainer>
  );
}

export default MultiTreeSelectComponent;
