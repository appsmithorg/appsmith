import React from "react";

import { CellWrapper } from "../TableStyledWrappers";
import { CellAlignment, VerticalAlignment } from "../Constants";
import { Button } from "./Button";
import { ButtonColumnActions } from "widgets/TableWidgetV2/constants";

export interface RenderActionProps {
  compactMode: string;
  isSelected: boolean;
  columnActions?: ButtonColumnActions[];
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isHidden: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  textSize?: string;
}

export function ButtonCell(props: RenderActionProps) {
  const {
    allowCellWrapping,
    cellBackground,
    columnActions,
    compactMode,
    fontStyle,
    horizontalAlignment,
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
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      {columnActions.map((action: ButtonColumnActions, index: number) => {
        return (
          <Button
            action={action}
            isCellVisible={isCellVisible}
            isDisabled={isDisabled}
            isSelected={isSelected}
            key={index}
            onCommandClick={onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
}
