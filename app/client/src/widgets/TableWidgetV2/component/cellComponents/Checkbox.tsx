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
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import styled from "styled-components";

const CheckboxCellWrapper = styled(CellWrapper)<{
  cellComponentHorizontalAlignment?: CellAlignment;
}>`
  & > div {
    justify-content: ${(props) =>
      props.cellComponentHorizontalAlignment &&
      JUSTIFY_CONTENT[props.cellComponentHorizontalAlignment]} !important;

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
  columnAction: ColumnAction;
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete?: () => void) => void;
  borderRadius: string;
};

export const CheckboxCell = (props: CheckboxCellProps) => {
  const {
    accentColor,
    allowCellWrapping,
    borderRadius,
    cellBackground,
    cellComponentHorizontalAlignment,
    columnAction,
    compactMode,
    fontStyle,
    isCellVisible,
    isDisabled,
    isHidden,
    onCommandClick,
    textColor,
    textSize,
    value,
    verticalAlignment,
  } = props;

  const handleChange = () => {
    onCommandClick(columnAction.dynamicTrigger);
  };

  return (
    <CheckboxCellWrapper
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      cellComponentHorizontalAlignment={cellComponentHorizontalAlignment}
      compactMode={compactMode}
      fontStyle={fontStyle}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      <CheckboxComponent
        accentColor={accentColor}
        borderRadius={borderRadius}
        isChecked={value}
        isDisabled={isDisabled}
        isLoading={false}
        isRequired={false}
        key={columnAction.id}
        label=""
        labelPosition={LabelPosition.Auto}
        onCheckChange={handleChange}
        rowSpace={5}
        widgetId={""}
      />
    </CheckboxCellWrapper>
  );
};
