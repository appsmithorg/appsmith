import React, { useContext } from "react";

import { CellCheckboxWrapper, CellCheckbox } from "../TableStyledWrappers";
import { CheckboxState } from "../Constants";
import { importSvg } from "design-system-old";
import { TableContext } from "widgets/TableWidgetV2/widget";

const CheckBoxCheckIcon = importSvg(
  async () => import("assets/icons/widget/table/checkbox-check.svg"),
);
const CheckBoxLineIcon = importSvg(
  async () => import("assets/icons/widget/table/checkbox-line.svg"),
);

export const RenderBodyCheckBoxCell = (props: {
  isChecked: boolean;
  accentColor?: string;
  borderRadius?: string;
}) => {
  const { accentColor, borderRadius, isChecked } = props;

  const tableDimensions = useContext(TableContext).tableDimensions;

  return (
    <CellCheckboxWrapper
      accentColor={accentColor}
      borderRadius={borderRadius}
      className="td t--table-multiselect"
      data-sticky-td="true"
      isCellVisible
      isChecked={isChecked}
      tableDimensions={tableDimensions}
    >
      <CellCheckbox>
        {isChecked && <CheckBoxCheckIcon className="th-svg" />}
      </CellCheckbox>
    </CellCheckboxWrapper>
  );
};

const STYLE = { padding: "0px", justifyContent: "center" };

export const RenderHeaderCheckBoxCell = (props: {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  checkState: number | null;
  accentColor: string;
  borderRadius: string;
}) => {
  const { accentColor, borderRadius, checkState, onClick } = props;

  const tableDimensions = useContext(TableContext).tableDimensions;

  return (
    <CellCheckboxWrapper
      accentColor={accentColor}
      borderRadius={borderRadius}
      className="th header-reorder t--table-multiselect-header"
      data-sticky-td="true"
      isChecked={!!checkState}
      onClick={onClick}
      role="columnheader"
      style={STYLE}
      tableDimensions={tableDimensions}
    >
      <CellCheckbox>
        {/*1 - all row selected | 2 - some rows selected */}
        {checkState === CheckboxState.CHECKED && (
          <CheckBoxCheckIcon className="th-svg" />
        )}
        {checkState === CheckboxState.PARTIAL && (
          <CheckBoxLineIcon className="th-svg t--table-multiselect-header-half-check-svg" />
        )}
      </CellCheckbox>
    </CellCheckboxWrapper>
  );
};
