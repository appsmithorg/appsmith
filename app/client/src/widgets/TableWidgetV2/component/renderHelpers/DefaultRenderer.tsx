import React from "react";
import { isNumber, isNil } from "lodash";

import { ColumnTypes, CellLayoutProperties } from "../Constants";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";
import { InlineCellEditor } from "../components/InlineCellEditor";

export type renderDefaultPropsType = {
  value: any;
  columnType: string;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  tableWidth: number;
  isCellVisible: boolean;
  isCellEditMode?: boolean;
  onCellChange: (data: string) => void;
  toggleCellEditMode: (editMode: boolean) => void;
};

export function getCellText(
  value: any,
  cellProperties: CellLayoutProperties,
  columnType: string,
) {
  let text;

  if (value && columnType === ColumnTypes.URL && cellProperties.displayText) {
    text = cellProperties.displayText;
  } else if (!isNil(value) && (!isNumber(value) || !isNaN(value))) {
    text = value.toString();
  } else {
    text = "";
  }

  return text;
}

export const renderDefault = (props: renderDefaultPropsType) => {
  const {
    cellProperties,
    columnType,
    isCellEditMode,
    isCellVisible,
    isHidden,
    onCellChange,
    tableWidth,
    toggleCellEditMode,
    value,
  } = props;

  let cell;

  if (isCellEditMode) {
    cell = (
      <InlineCellEditor
        onBlur={() => toggleCellEditMode(false)}
        onChange={(text: string) => onCellChange(text)}
        value={value}
      />
    );
  } else {
    cell = (
      <AutoToolTipComponent
        cellProperties={cellProperties}
        columnType={columnType}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        title={!!value ? value.toString() : ""}
      >
        <div onClick={() => toggleCellEditMode(true)}>
          {getCellText(value, cellProperties, columnType)}
        </div>
      </AutoToolTipComponent>
    );
  }

  return cell;
};
