import React from "react";
import {
  ALIGN_ITEMS,
  BaseCellComponentProps,
  CellAlignment,
  JUSTIFY_CONTENT,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import CheckboxComponent from "widgets/CheckboxWidget/component/index";
import { LabelPosition } from "components/constants";
import styled from "styled-components";
import SwitchComponent from "widgets/SwitchWidget/component";
import { AlignWidgetTypes } from "widgets/constants";

const SwitchCellWrapper = styled(CellWrapper)<{
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
      &:hover,
      .bp3-control-indicator:hover {
        cursor: pointer;
      }
    }
  }
`;

type SwitchCellProps = BaseCellComponentProps & {
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onChange: () => void;
};

export const SwitchCell = (props: SwitchCellProps) => {
  const {
    accentColor,
    cellBackground,
    compactMode,
    horizontalAlignment,
    isCellVisible,
    isDisabled,
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
      <SwitchComponent
        accentColor={accentColor}
        alignWidget={AlignWidgetTypes.LEFT}
        isDisabled={isDisabled}
        isLoading={false}
        isSwitchedOn={value}
        label=""
        labelPosition={LabelPosition.Auto}
        onChange={() => onChange()}
        widgetId={""}
      />
    </SwitchCellWrapper>
  );
};
