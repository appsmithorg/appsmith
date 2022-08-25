import React from "react";
import {
  ALIGN_ITEMS,
  BaseCellComponentProps,
  CellAlignment,
  JUSTIFY_CONTENT,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import CheckboxComponent from "widgets/CheckboxWidget/component/index";
import { LabelPosition } from "components/constants";
import styled from "styled-components";

const CheckboxCellWrapper = styled(CellWrapper)<{
  horizontalAlignment?: CellAlignment;
}>`
  & > div {
    justify-content: ${(props) =>
      props.horizontalAlignment &&
      JUSTIFY_CONTENT[props.horizontalAlignment]} !important;

    align-items: ${(props) =>
      props.verticalAlignment &&
      ALIGN_ITEMS[props.verticalAlignment]} !important;

    & .bp3-checkbox {
      gap: 0px;
      cursor: pointer;
      & .bp3-control-indicator::before {
        cursor: pointer;
      }
    }
  }
`;

type CheckboxCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onChange: () => void;
  borderRadius: string;
};

export const CheckboxCell = (props: CheckboxCellProps) => {
  const {
    accentColor,
    borderRadius,
    cellBackground,
    compactMode,
    horizontalAlignment,
    isCellVisible,
    isDisabled,
    isHidden,
    onChange,
    value,
    verticalAlignment,
  } = props;

  return (
    <CheckboxCellWrapper
      cellBackground={cellBackground}
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      verticalAlignment={verticalAlignment}
    >
      <CheckboxComponent
        accentColor={accentColor}
        borderRadius={borderRadius}
        isChecked={value}
        isDisabled={isDisabled}
        isLoading={false}
        isRequired={false}
        label=""
        labelPosition={LabelPosition.Auto}
        onCheckChange={() => onChange()}
        widgetId={""}
      />
    </CheckboxCellWrapper>
  );
};
