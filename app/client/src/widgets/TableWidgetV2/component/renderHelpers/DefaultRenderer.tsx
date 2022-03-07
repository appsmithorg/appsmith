import React from "react";
import { noop, isString, isNil } from "lodash";

import { ColumnTypes, CellLayoutProperties } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";
import { renderInlineEditor } from "./InlineEditorRenderer";

export type renderDefaultPropsType = {
  value: any;
  columnType: string;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  tableWidth: number;
  isCellVisible: boolean;
  isSelected?: boolean;
  cellEditMode?: boolean;
  onCellChange?: (data: string) => void;
  onCellUpdate?: (data: string) => void;
};

export const renderDefault = (args: renderDefaultPropsType) => {
  const {
    cellEditMode,
    cellProperties,
    columnType,
    isCellVisible,
    isHidden,
    onCellChange,
    tableWidth,
    value,
  } = args;

  let cell;

  if (cellEditMode) {
    cell = renderInlineEditor({
      value,
      onCellChange,
    });
  } else {
    cell =
      value && columnType === ColumnTypes.URL && cellProperties.displayText
        ? cellProperties.displayText
        : !isNil(value) && !isNaN(value as number)
        ? value.toString()
        : "";
  }

  return (
    <AutoToolTipComponent
      cellProperties={cellProperties}
      columnType={columnType}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      tableWidth={tableWidth}
      title={!!value ? value.toString() : ""}
    >
      {cell}
    </AutoToolTipComponent>
  );
};
