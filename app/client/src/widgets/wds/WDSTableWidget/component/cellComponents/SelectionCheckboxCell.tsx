import React from "react";

import { CellCheckboxWrapper } from "../TableStyledWrappers";
import { CheckboxState } from "../Constants";
import { Checkbox } from "@design-system/widgets";

export const renderBodyCheckBoxCell = (isChecked: boolean) => (
  <CellCheckboxWrapper
    className="td t--table-multiselect"
    data-sticky-td="true"
    isCellVisible
    role="cell"
  >
    <Checkbox isSelected={!!isChecked} />
  </CellCheckboxWrapper>
);

export const renderHeaderCheckBoxCell = (
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  checkState: number | null,
) => (
  <CellCheckboxWrapper
    className="th header-reorder t--table-multiselect-header"
    data-sticky-td="true"
    onClick={onClick}
    role="columnheader"
  >
    <Checkbox
      isIndeterminate={checkState === CheckboxState.PARTIAL}
      isSelected={!!checkState}
    />
  </CellCheckboxWrapper>
);
