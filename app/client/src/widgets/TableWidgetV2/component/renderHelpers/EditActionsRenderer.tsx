import React from "react";
import { IconName } from "@blueprintjs/icons";

import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { EditActionButton } from "../cellComponents/EditActionButton";
import { CellLayoutProperties } from "../Constants";
import { ButtonVariant } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { ButtonBorderRadius } from "components/constants";
import { CellWrapper } from "../TableStyledWrappers";

export type EditColumnActions = ColumnAction & {
  eventType: EventType;
  iconName?: IconName;
  variant: ButtonVariant;
  backgroundColor: string;
  iconAlign?: Alignment;
  borderRadius?: ButtonBorderRadius;
  isVisible?: boolean;
  isDisabled?: boolean;
};

type RenderEditActionsProps = {
  compactMode: string;
  isSelected: boolean;
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
          <EditActionButton
            action={action}
            isCellVisible={props.isCellVisible}
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
