import React, { ReactNode, useCallback, useRef } from "react";
import TreeSelect, { TreeSelectProps as SelectProps } from "rc-tree-select";
import {
  TreeSelectContainer,
  DropdownStyles,
  inputIcon,
  StyledLabel,
} from "./index.styled";
import "rc-tree-select/assets/index.less";
import { DefaultValueType } from "rc-tree-select/lib/interface";
import { TreeNodeProps } from "rc-tree-select/lib/TreeNode";
import {
  CANVAS_CLASSNAME,
  MODAL_PORTAL_CLASSNAME,
  TextSize,
} from "constants/WidgetConstants";

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

const switcherIcon = (obj: TreeNodeProps) => {
  if (obj.isLeaf) {
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
  return getSvg({ transform: `rotate(${obj.expanded ? 90 : 0}deg)` });
};

function TreeSingleSelectComponent({
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
  onChange,
  options,
  placeholder,
  value,
}: TreeSelectProps): JSX.Element {
  const _menu = useRef<HTMLElement | null>(null);

  const getDropdownPosition = useCallback((node: HTMLElement | null) => {
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    return document.querySelector(`.${CANVAS_CLASSNAME}`) as HTMLElement;
  }, []);

  return (
    <TreeSelectContainer
      compactMode={compactMode}
      ref={_menu as React.RefObject<HTMLDivElement>}
    >
      <DropdownStyles />
      {labelText && (
        <StyledLabel
          className="tree-select-label"
          compactMode={compactMode}
          labelStyle={labelStyle}
          labelText={labelText}
          labelTextColor={labelTextColor}
          labelTextSize={labelTextSize}
        >
          {labelText}
        </StyledLabel>
      )}
      <TreeSelect
        allowClear={allowClear}
        animation="slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        className="rc-tree-select"
        disabled={disabled}
        dropdownClassName="tree-select-dropdown single-tree-select-dropdown"
        dropdownStyle={dropdownStyle}
        getPopupContainer={() => getDropdownPosition(_menu.current)}
        inputIcon={inputIcon}
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        notFoundContent="No item Found"
        onChange={onChange}
        onClear={() => {
          onChange([], []);
        }}
        placeholder={placeholder}
        showArrow
        showSearch
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

export default TreeSingleSelectComponent;
