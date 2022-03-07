import React from "react";
import { renderDefaultPropsType } from "./DefaultRenderer";

type renderInlineEditorPropsType = Pick<
  renderDefaultPropsType,
  "value" | "onCellChange" | "onCellUpdate"
>;

export function renderInlineEditor({
  onCellChange,
  onCellUpdate,
  value,
}: renderInlineEditorPropsType) {
  return (
    <input
      defaultValue={value.toString()}
      onChange={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onCellChange && onCellChange(e.target.value);
      }}
      type="text"
    />
  );
}
