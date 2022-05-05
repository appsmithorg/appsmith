import React from "react";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ButtonColumnActions,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { Button } from "../cellComponents/Button";
import {
  CellAlignment,
  CellLayoutProperties,
  VerticalAlignment,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";

type RenderEditActionsProps = {
  compactMode: string;
  isSelected: boolean;
  isCellVisible: boolean;
  isHidden: boolean;
  columnActions: ButtonColumnActions[];
  onCommandClick: (
    dynamicTrigger: string,
    onComplete: () => void,
    eventType: EventType,
  ) => void;
  onDiscard: () => void;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
};

export function EditActionCell(props: RenderEditActionsProps) {
  const {
    allowCellWrapping,
    columnActions,
    compactMode,
    horizontalAlignment,
    isCellVisible,
    isHidden,
    isSelected,
    onCommandClick,
    onDiscard,
    verticalAlignment,
  } = props;

  if (!columnActions) {
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
  }

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
            isDisabled={action.isDisabled}
            isSelected={isSelected}
            key={index}
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
