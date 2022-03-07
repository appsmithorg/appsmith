import React from "react";
import { noop, isString, isNil } from "lodash";

import { ColumnTypes, CellLayoutProperties } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";

type renderCellType = {
  value: any;
  columnType: string;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  tableWidth: number;
  isCellVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  cellEditMode?: boolean;
  onCellChange?: (data: string) => void;
  onCellUpdate?: (data: string) => void;
};

export const renderCell = (args: renderCellType) => {
  const {
    value,
    columnType,
    isHidden,
    cellProperties,
    tableWidth,
    isCellVisible,
    onClick = noop,
    isSelected,
    cellEditMode,
    onCellChange,
  } = args;

  switch (columnType) {
    case ColumnTypes.VIDEO:

    default:
      let cell;

      if (cellEditMode) {
        cell = (
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
      } else {
        cell =
          value && columnType === ColumnTypes.URL && cellProperties.displayText
            ? cellProperties.displayText
            : !isNil(value) && !isNaN(value)
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
  }
};
