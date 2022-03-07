import React, { useState } from "react";

import { CellWrapper, ActionWrapper } from "../TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { CellLayoutProperties } from "../Constants";
import Button from "components/editorComponents/Button";

function TableButton(props: {
  isSelected: boolean;
  action: ColumnAction;
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
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
          intent="PRIMARY_BUTTON"
          loading={loading}
          onClick={() => {
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

interface RenderActionProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

export const renderButton = (
  props: RenderActionProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  if (!props.columnActions)
    return (
      <CellWrapper
        cellProperties={cellProperties}
        isCellVisible={props.isCellVisible}
        isHidden={isHidden}
      />
    );

  return (
    <CellWrapper
      cellProperties={cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={isHidden}
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
