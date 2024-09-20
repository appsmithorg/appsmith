import React, { memo } from "react";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ButtonColumnActions } from "widgets/TableWidgetV2/constants";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { Button } from "./Button";
import type { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";

type RenderEditActionsProps = BaseCellComponentProps & {
  isSelected: boolean;
  columnActions: ButtonColumnActions[];
  onCommandClick: (
    dynamicTrigger: string,
    onComplete: () => void,
    eventType: EventType,
  ) => void;
  onDiscard: () => void;
};

function EditActionCellComponent(props: RenderEditActionsProps) {
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

export const EditActionCell = memo(EditActionCellComponent);
