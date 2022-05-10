import React from "react";

import { CellCheckboxWrapper, CellCheckbox } from "../TableStyledWrappers";
import { ReactComponent as CheckBoxCheckIcon } from "assets/icons/widget/table/checkbox-check.svg";
import { ReactComponent as CheckBoxLineIcon } from "assets/icons/widget/table/checkbox-line.svg";

export const renderBodyCheckBoxCell = (
  isChecked: boolean,
  accentColor: string,
  borderRadius: string,
) => (
  <CellCheckboxWrapper
    accentColor={accentColor}
    borderRadius={borderRadius}
    className="td t--table-multiselect"
    isCellVisible
    isChecked={isChecked}
  >
    <CellCheckbox>
      {isChecked && <CheckBoxCheckIcon className="th-svg" />}
    </CellCheckbox>
  </CellCheckboxWrapper>
);

export const renderHeaderCheckBoxCell = (
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  checkState: number | null,
  accentColor: string,
  borderRadius: string,
) => (
  <CellCheckboxWrapper
    accentColor={accentColor}
    borderRadius={borderRadius}
    className="th header-reorder t--table-multiselect-header"
    isChecked={!!checkState}
    onClick={onClick}
    role="columnheader"
    style={{ padding: "0px", justifyContent: "center" }}
  >
    <CellCheckbox>
      {checkState === 1 && <CheckBoxCheckIcon className="th-svg" />}
      {checkState === 2 && (
        <CheckBoxLineIcon className="th-svg t--table-multiselect-header-half-check-svg" />
      )}
    </CellCheckbox>
  </CellCheckboxWrapper>
);
