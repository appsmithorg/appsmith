import React from "react";

import { CellWrapper } from "../TableStyledWrappers";
import {
  CellAlignment,
  CellLayoutProperties,
  VerticalAlignment,
} from "../Constants";
import { Button } from "../cellComponents/Button";
import { ButtonColumnActions } from "widgets/TableWidgetV2/constants";

export interface RenderActionProps {
  compactMode: string;
  isSelected: boolean;
  columnActions?: ButtonColumnActions[];
  backgroundColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isHidden: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
}

export function ButtonCell(props: RenderActionProps) {
  const {
    allowCellWrapping,
    columnActions,
    compactMode,
    horizontalAlignment,
    isCellVisible,
    isDisabled,
    isHidden,
    isSelected,
    onCommandClick,
    verticalAlignment,
  } = props;

  if (!columnActions)
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
      />
    );

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
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
