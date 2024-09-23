import React, { memo } from "react";

import { CellWrapper } from "../TableStyledWrappers";
import type { BaseCellComponentProps } from "../Constants";
import { TABLE_SIZES } from "../Constants";
import { Button } from "./Button";
import type { ButtonColumnActions } from "widgets/TableWidgetV2/constants";
import styled from "styled-components";

const StyledButton = styled(Button)<{ compactMode: string }>`
  max-height: ${(props) => TABLE_SIZES[props.compactMode].ROW_HEIGHT}px;
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
          />
        );
      })}
    </CellWrapper>
  );
}

export const ButtonCell = memo(ButtonCellComponent);
