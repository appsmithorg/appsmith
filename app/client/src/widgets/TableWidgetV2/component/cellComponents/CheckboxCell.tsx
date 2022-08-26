import React from "react";
import {
  ALIGN_ITEMS,
  BaseCellComponentProps,
  CellAlignment,
  JUSTIFY_CONTENT,
} from "../Constants";
import { CellWrapper, TooltipContentWrapper } from "../TableStyledWrappers";
import CheckboxComponent from "widgets/CheckboxWidget/component/index";
import { LabelPosition } from "components/constants";
import styled from "styled-components";
import { Tooltip } from "@blueprintjs/core";

const UnsavedChangesMarker = styled.div<{ accentColor: string }>`
  position: absolute;
  top: -1px;
  right: -3px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid ${(props) => props.accentColor};
  transform: rotateZ(45deg);
`;

const CheckboxCellWrapper = styled(CellWrapper)<{
  horizontalAlignment?: CellAlignment;
}>`
  & > div {
    justify-content: ${(props) =>
      props.horizontalAlignment &&
      JUSTIFY_CONTENT[props.horizontalAlignment]} !important;

    align-items: ${(props) =>
      props.verticalAlignment &&
      ALIGN_ITEMS[props.verticalAlignment]} !important;

    & .bp3-checkbox {
      gap: 0px;
    }

    & .bp3-disabled {
      cursor: grab;
      & .bp3-control-indicator::before {
        cursor: grab;
      }
    }
  }
`;

type CheckboxCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onChange: () => void;
  borderRadius: string;
  hasUnSavedChanges?: boolean;
  disabledCheckbox: boolean;
  isCellEditable: boolean;
  isCellEditMode?: boolean;
};

export const CheckboxCell = (props: CheckboxCellProps) => {
  const {
    accentColor,
    borderRadius,
    cellBackground,
    compactMode,
    disabledCheckbox,
    hasUnSavedChanges,
    horizontalAlignment,
    isCellEditable,
    isCellVisible,
    isHidden,
    onChange,
    value,
    verticalAlignment,
  } = props;

  return (
    <CheckboxCellWrapper
      cellBackground={cellBackground}
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      verticalAlignment={verticalAlignment}
    >
      {hasUnSavedChanges && <UnsavedChangesMarker accentColor={accentColor} />}

      {isCellEditable ? (
        !!disabledCheckbox ? (
          <Tooltip
            autoFocus={false}
            content={
              <TooltipContentWrapper>
                Save or discard the unsaved row to start editing here
              </TooltipContentWrapper>
            }
            hoverOpenDelay={200}
            position="top"
          >
            <CheckboxComponent
              accentColor={accentColor}
              borderRadius={borderRadius}
              isChecked={value}
              isDisabled={!!disabledCheckbox}
              isLoading={false}
              isRequired={false}
              label=""
              labelPosition={LabelPosition.Auto}
              onCheckChange={() => onChange()}
              widgetId={""}
            />
          </Tooltip>
        ) : (
          <CheckboxComponent
            accentColor={accentColor}
            borderRadius={borderRadius}
            isChecked={value}
            isDisabled={!!disabledCheckbox}
            isLoading={false}
            isRequired={false}
            label=""
            labelPosition={LabelPosition.Auto}
            onCheckChange={() => onChange()}
            widgetId={""}
          />
        )
      ) : (
        <CheckboxComponent
          accentColor={accentColor}
          borderRadius={borderRadius}
          isChecked={value}
          isDisabled={!isCellEditable}
          isLoading={false}
          isRequired={false}
          label=""
          labelPosition={LabelPosition.Auto}
          onCheckChange={() => onChange()}
          widgetId={""}
        />
      )}
    </CheckboxCellWrapper>
  );
};
