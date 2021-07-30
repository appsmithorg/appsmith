import React from "react";
import TreeSelect, { TreeSelectProps as SelectProps } from "rc-tree-select";
import { TreeSelectContainer, DropdownStyles, inputIcon } from "./index.styled";
import "rc-tree-select/assets/index.less";
import { DefaultValueType } from "rc-tree-select/lib/interface";
import { TreeNodeProps } from "rc-tree-select/lib/TreeNode";
import { SelectionType } from "widgets/TreeSelectWidget";
import { CheckedStrategy } from "rc-tree-select/lib/utils/strategyUtil";

export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "options" | "placeholder" | "loading" | "dropdownStyle"
    >
  > {
  value?: DefaultValueType;
  onChange: (value: DefaultValueType) => void;
  selectionType: SelectionType;
  expandAll: boolean;
  mode: CheckedStrategy;
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

function TreeSelectComponent({
  disabled,
  dropdownStyle,
  expandAll,
  loading,
  mode,
  onChange,
  options,
  placeholder,
  selectionType,
  value,
}: TreeSelectProps): JSX.Element {
  return (
    <TreeSelectContainer>
      <DropdownStyles />
      {/* <StyledText>Label</StyledText> */}
      <TreeSelect
        animation="slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        className="rc-tree-select"
        disabled={disabled}
        dropdownClassName={`tree-select-dropdown ${selectionType ===
          "SINGLE_SELECT" && "single-tree-select-dropdown"}`}
        dropdownStyle={dropdownStyle}
        inputIcon={inputIcon}
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        multiple={selectionType === "MULTI_SELECT"}
        onChange={onChange}
        placeholder={placeholder}
        showArrow
        showCheckedStrategy={mode}
        showSearch
        style={{ width: "100%" }}
        switcherIcon={switcherIcon}
        transitionName="rc-tree-select-dropdown-slide-up"
        treeCheckable={
          selectionType === "MULTI_SELECT" ? (
            <span className={`rc-tree-select-tree-checkbox-inner`} />
          ) : null
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

export default TreeSelectComponent;
