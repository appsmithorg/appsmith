import React, { useState } from "react";

import { CellWrapper, ActionWrapper } from "../TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { CellLayoutProperties } from "../Constants";
import Button from "components/editorComponents/Button";

export function TableButton(props: {
  isSelected: boolean;
  action: ColumnAction;
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  icon?: string;
}) {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };

  return (
    <ActionWrapper
      background={props.backgroundColor}
      buttonLabelColor={props.buttonLabelColor}
      onClick={(e) => {
        if (props.isSelected) {
          e.stopPropagation();
        }
      }}
    >
      {props.isCellVisible ? (
        <Button
          disabled={props.isDisabled}
          filled
          icon={props.icon}
          intent="PRIMARY_BUTTON"
          loading={loading}
          onClick={(e) => {
            e?.stopPropagation();
            setLoading(true);
            props.onCommandClick(props.action.dynamicTrigger, onComplete);
          }}
          size="small"
          text={props.action.label}
        />
      ) : null}
    </ActionWrapper>
  );
}

export interface RenderActionProps {
  compactMode: string;
  isSelected: boolean;
  columnActions?: ColumnAction[];
  backgroundColor: string;
  buttonLabelColor: string;
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
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <TableButton
            action={action}
            backgroundColor={props.backgroundColor}
            buttonLabelColor={props.buttonLabelColor}
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
