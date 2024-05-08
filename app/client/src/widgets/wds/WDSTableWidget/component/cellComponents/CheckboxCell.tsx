import React, { memo } from "react";
import type { BaseCellComponentProps, CellAlignment } from "../Constants";
import { ALIGN_ITEMS, JUSTIFY_CONTENT } from "../Constants";
import { CellWrapper, TooltipContentWrapper } from "../TableStyledWrappers";
import CheckboxComponent from "widgets/CheckboxWidget/component/index";
import { LabelPosition } from "components/constants";
import styled from "styled-components";
import { Tooltip } from "@blueprintjs/core";
import { Checkbox } from "@design-system/widgets";

const UnsavedChangesMarker = styled.div<{ accentColor: string }>`
  position: absolute;
  top: -1px;
  right: -3px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid ${(props) => props.accentColor};
  transform: rotateZ(45deg);
`;

const CheckboxCellWrapper = styled(CellWrapper)<{
  horizontalAlignment?: CellAlignment;
}>`
  & div {
    & .bp3-checkbox {
      gap: 0px;
    }
  }
  & .bp3-disabled {
    cursor: grab !important;
    & .bp3-control-indicator::before {
      cursor: grab !important;
    }
  }

  & > .bp3-popover-wrapper {
    overflow: unset;
  }
`;

type CheckboxCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onChange: () => void;
  borderRadius: string;
  hasUnSavedChanges?: boolean;
  disabledCheckbox: boolean;
  isCellEditable: boolean;
  disabledCheckboxMessage: string;
};

const CheckboxCellComponent = (props: CheckboxCellProps) => {
  const { disabledCheckbox, isCellEditable, onChange, value } = props;

  return (
    <Checkbox
      isDisabled={!!disabledCheckbox || !isCellEditable}
      isRequired={false}
      isSelected={value}
      onChange={() => onChange()}
    />
  );
};

export const CheckboxCell = memo(CheckboxCellComponent);
