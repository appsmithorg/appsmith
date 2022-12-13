import React from "react";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ButtonColumnActions,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { Button } from "./Button";
import { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import { TableSizes } from "./../Constants";

type RenderEditActionsProps = BaseCellComponentProps & {
  isSelected: boolean;
  columnActions: ButtonColumnActions[];
  onCommandClick: (
    dynamicTrigger: string,
    onComplete: () => void,
    eventType: EventType,
  ) => void;
  onDiscard: () => void;
  tableSizes: TableSizes;
};

export function EditActionCell(props: RenderEditActionsProps) {
  const {
    allowCellWrapping,
    cellBackground,
    columnActions,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellDisabled,
    isCellVisible,
    isHidden,
    isSelected,
    onCommandClick,
    onDiscard,
    textColor,
    textSize,
    verticalAlignment,
    tableSizes,
  } = props;

  if (!columnActions) {
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
        tableSizes={tableSizes}
      />
    );
  }

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      className="cell-wrapper"
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellDisabled={isCellDisabled}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      verticalAlignment={verticalAlignment}
      tableSizes={tableSizes}
    >
      {columnActions.map((action: ButtonColumnActions) => {
        return (
          <Button
            action={action}
            isCellVisible={isCellVisible}
            isDisabled={action.isDisabled}
            isSelected={isSelected}
            key={action.id}
            onCommandClick={(
              dynamicTrigger: string,
              onComplete: () => void,
            ) => {
              if (action.id === EditableCellActions.DISCARD) {
                onDiscard();
              }

              onCommandClick(dynamicTrigger, onComplete, action.eventType);
            }}
          />
        );
      })}
    </CellWrapper>
  );
}
