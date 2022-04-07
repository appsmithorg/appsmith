import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import React from "react";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { CellLayoutProperties } from "../Constants";

import { CellWrapper } from "../TableStyledWrappers";
import { TableButton } from "./ButtonRenderer";

type EditColumnActions = ColumnAction & { eventType: EventType };

type RenderEditActionsProps = {
  compactMode: string;
  isSelected: boolean;
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  cellProperties: CellLayoutProperties;
  isHidden: boolean;
  columnActions: EditColumnActions[];
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
      {props.columnActions.map((action: EditColumnActions, index: number) => {
        return (
          <TableButton
            action={action}
            backgroundColor={props.backgroundColor}
            buttonLabelColor={props.buttonLabelColor}
            isCellVisible={props.isCellVisible}
            isDisabled={props.isDisabled}
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
