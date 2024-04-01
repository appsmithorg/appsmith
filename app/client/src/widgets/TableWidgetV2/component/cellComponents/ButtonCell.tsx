import React, { memo, useContext } from "react";

import { CellWrapper } from "../TableStyledWrappers";
import type { BaseCellComponentProps, TableSizes } from "../Constants";
import { Button } from "./Button";
import type { ButtonColumnActions } from "widgets/TableWidgetV2/constants";
import styled from "styled-components";
import { TableContext } from "widgets/TableWidgetV2/widget";

const StyledButton = styled(Button)<{
  compactMode: string;
  tableDimensions: TableSizes;
}>`
  max-height: ${(props) => props.tableDimensions.ROW_HEIGHT}px;
`;

export interface RenderActionProps extends BaseCellComponentProps {
  isSelected: boolean;
  columnActions?: ButtonColumnActions[];
  isDisabled: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

function ButtonCellComponent(props: RenderActionProps) {
  const {
    allowCellWrapping,
    cellBackground,
    columnActions,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellDisabled,
    isCellVisible,
    isDisabled,
    isHidden,
    isSelected,
    onCommandClick,
    textColor,
    textSize,
    verticalAlignment,
  } = props;

  const tableDimensions = useContext(TableContext).tableDimensions;

  if (!columnActions)
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableDimensions={tableDimensions}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      />
    );

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      compactMode={compactMode}
      fontStyle={fontStyle}
      horizontalAlignment={horizontalAlignment}
      isCellDisabled={isCellDisabled}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      tableDimensions={tableDimensions}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      {columnActions.map((action: ButtonColumnActions) => {
        return (
          <StyledButton
            action={action}
            compactMode={compactMode}
            isCellVisible={isCellVisible}
            isDisabled={isDisabled}
            isSelected={isSelected}
            key={action.id}
            onCommandClick={onCommandClick}
            tableDimensions={tableDimensions}
          />
        );
      })}
    </CellWrapper>
  );
}
export const ButtonCell = memo(ButtonCellComponent);
