import React from "react";

import { CellWrapper } from "../TableStyledWrappers";
import { CellLayoutProperties } from "../Constants";
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
  cellProperties: CellLayoutProperties;
  isHidden: boolean;
}

export const renderButton = (props: RenderActionProps) => {
  if (!props.columnActions)
    return (
      <CellWrapper
        cellProperties={props.cellProperties}
        compactMode={props.compactMode}
        isCellVisible={props.isCellVisible}
        isHidden={props.isHidden}
      />
    );

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
            isDisabled={props.isDisabled}
            isSelected={props.isSelected}
            key={index}
            onCommandClick={props.onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
};
