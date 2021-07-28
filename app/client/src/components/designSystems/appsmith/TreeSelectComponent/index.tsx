import React from "react";
import TreeSelect, {
  SHOW_PARENT,
  TreeSelectProps as SelectProps,
} from "rc-tree-select";
import { TreeSelectContainer, DropdownStyles, inputIcon } from "./index.styled";
import "rc-tree-select/assets/index.less";
import { DefaultValueType } from "rc-tree-select/lib/interface";
import { TreeNodeProps } from "rc-tree-select/lib/TreeNode";

export interface TreeSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "options" | "placeholder" | "loading" | "dropdownStyle"
    >
  > {
  mode?: "multiple" | "tags";
  value: string[];
  onChange: (value: DefaultValueType) => void;
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
  loading,
  onChange,
  options,
  placeholder,
  value,
}: TreeSelectProps): JSX.Element {
  // const dropdownRender = useCallback(
  //   (
  //     menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
  //   ) => (
  //     <>
  //       {options.length ? (
  //         <StyledCheckbox
  //           alignIndicator="left"
  //           checked={isSelectAll}
  //           label="Select all"
  //           onChange={handleSelectAll}
  //         />
  //       ) : null}
  //       {menu}
  //     </>
  //   ),
  //   [isSelectAll, options],
  // );
  return (
    <TreeSelectContainer>
      <DropdownStyles />
      {/* <StyledText>Label</StyledText> */}
      <TreeSelect
        animation="slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        className="rc-tree-select"
        disabled={disabled}
        dropdownClassName="tree-select-dropdown"
        dropdownStyle={dropdownStyle}
        inputIcon={inputIcon}
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        multiple
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder="please search"
        showArrow
        showCheckedStrategy={SHOW_PARENT}
        showSearch
        style={{ width: "100%" }}
        switcherIcon={switcherIcon}
        transitionName="rc-tree-select-dropdown-slide-up"
        treeCheckable={
          <span className={`rc-tree-select-tree-checkbox-inner`} />
        }
        treeData={options}
        treeIcon
        treeNodeFilterProp="label"
        value={value}
      />
    </TreeSelectContainer>
  );
}

export default TreeSelectComponent;
