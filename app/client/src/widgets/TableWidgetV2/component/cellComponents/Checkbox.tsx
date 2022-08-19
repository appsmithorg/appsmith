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
      &:hover,
      .bp3-control-indicator:hover {
        cursor: pointer;
      }
    }
  }
`;

type CheckboxCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onCommandClick: () => void;
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
    onCommandClick,
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
        onCheckChange={() => onCommandClick()}
        widgetId={""}
      />
    </CheckboxCellWrapper>
  );
};
