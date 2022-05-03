import React from "react";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ButtonColumnActions,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { Button } from "../cellComponents/Button";
import { CellLayoutProperties } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";

type RenderEditActionsProps = {
  compactMode: string;
  isSelected: boolean;
  isCellVisible: boolean;
  cellProperties: CellLayoutProperties;
  isHidden: boolean;
  columnActions: ButtonColumnActions[];
  onCommandClick: (
    dynamicTrigger: string,
    onComplete: () => void,
    eventType: EventType,
  ) => void;
  onDiscard: () => void;
};

export function renderEditActions(props: RenderEditActionsProps) {
  if (!props.columnActions) {
    return (
      <CellWrapper
        cellProperties={props.cellProperties}
        compactMode={props.compactMode}
        isCellVisible={props.isCellVisible}
        isHidden={props.isHidden}
      />
    );
  }

  return (
    <CellWrapper
      cellProperties={props.cellProperties}
      compactMode={props.compactMode}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
    >
      {props.columnActions.map((action: ButtonColumnActions, index: number) => {
        return (
          <Button
            action={action}
            isCellVisible={props.isCellVisible}
            isDisabled={action.isDisabled}
            isSelected={props.isSelected}
            key={index}
            onCommandClick={(
              dynamicTrigger: string,
              onComplete: () => void,
            ) => {
              if (action.id === EditableCellActions.DISCARD) {
                props.onDiscard();
              }

              props.onCommandClick(
                dynamicTrigger,
                onComplete,
                action.eventType,
              );
            }}
          />
        );
      })}
    </CellWrapper>
  );
}
