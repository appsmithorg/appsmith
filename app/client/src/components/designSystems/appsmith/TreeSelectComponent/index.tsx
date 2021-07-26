import React from "react";
import TreeSelect, { TreeSelectProps as SelectProps } from "rc-tree-select";
import { TreeSelectContainer } from "./index.styled";
import { DefaultValueType } from "rc-tree-select/lib/interface";

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

function TreeSelectComponent({
  disabled,
  dropdownStyle,
  loading,
  onChange,
  options,
  placeholder,
  value,
}: TreeSelectProps): JSX.Element {
  return (
    <TreeSelectContainer>
      <TreeSelect />
    </TreeSelectContainer>
  );
}

export default TreeSelectComponent;
