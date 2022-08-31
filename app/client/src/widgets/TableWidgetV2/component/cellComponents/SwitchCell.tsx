import React from "react";
import {
  ALIGN_ITEMS,
  BaseCellComponentProps,
  CellAlignment,
  JUSTIFY_CONTENT,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import { LabelPosition } from "components/constants";
import styled from "styled-components";
import SwitchComponent from "widgets/SwitchWidget/component";
import { AlignWidgetTypes } from "widgets/constants";

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

const SwitchCellWrapper = styled(CellWrapper)<{
  horizontalAlignment?: CellAlignment;
}>`
  & div {
    justify-content: ${(props) =>
      props.horizontalAlignment &&
      JUSTIFY_CONTENT[props.horizontalAlignment]} !important;

    align-items: ${(props) =>
      props.verticalAlignment &&
      ALIGN_ITEMS[props.verticalAlignment]} !important;

    & .bp3-checkbox {
      gap: 0px;
    }
  }
  & .bp3-disabled {
    cursor: grab !important;
    & .bp3-control-indicator::before {
      cursor: grab !important;
    }
  }

  & > .bp3-popover-wrapper {
    overflow: unset;
  }
`;

type SwitchCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  onChange: () => void;
  disabledSwitch: boolean;
  isCellEditable: boolean;
  hasUnSavedChanges?: boolean;
};

export const SwitchCell = (props: SwitchCellProps) => {
  const {
    accentColor,
    cellBackground,
    compactMode,
    disabledSwitch,
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
    <SwitchCellWrapper
      cellBackground={cellBackground}
      compactMode={compactMode}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      verticalAlignment={verticalAlignment}
    >
      {hasUnSavedChanges && <UnsavedChangesMarker accentColor={accentColor} />}
      {isCellEditable && !!disabledSwitch ? (
        <SwitchComponent
          accentColor={accentColor}
          alignWidget={AlignWidgetTypes.LEFT}
          isDisabled={!!disabledSwitch || !isCellEditable}
          isLoading={false}
          isSwitchedOn={value}
          label=""
          labelPosition={LabelPosition.Auto}
          onChange={() => onChange()}
          widgetId={""}
        />
      ) : (
        <SwitchComponent
          accentColor={accentColor}
          alignWidget={AlignWidgetTypes.LEFT}
          isDisabled={!!disabledSwitch || !isCellEditable}
          isLoading={false}
          isSwitchedOn={value}
          label=""
          labelPosition={LabelPosition.Auto}
          onChange={() => onChange()}
          widgetId={""}
        />
      )}
    </SwitchCellWrapper>
  );
};
