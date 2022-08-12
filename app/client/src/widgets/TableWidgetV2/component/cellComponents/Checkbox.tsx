import React from "react";
import { BaseCellComponentProps, CellAlignmentTypes } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import CheckboxComponent, {
  CheckboxComponentProps,
} from "widgets/CheckboxWidget/component/index";
import { Colors } from "constants/Colors";
import { AlignWidgetTypes } from "widgets/constants";
import { LabelPosition } from "components/constants";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { noop } from "lodash";

type renderCellType = BaseCellComponentProps & {
  columnAction: ColumnAction;
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  borderRadius: string;
};

export const CheckboxCell = (props: renderCellType) => {
  const {
    accentColor,
    allowCellWrapping,
    borderRadius,
    cellBackground,
    columnAction,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellVisible,
    isDisabled,
    isHidden,
    onCommandClick,
    textColor,
    textSize,
    value,
    verticalAlignment,
  } = props;

  const handleChange = () => {
    onCommandClick(columnAction.dynamicTrigger, noop);
  };

  return (
    <CellWrapper
      allowCellWrapping={allowCellWrapping}
      cellBackground={cellBackground}
      compactMode={compactMode}
      fontStyle={fontStyle}
      horizontalAlignment={horizontalAlignment}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
      textColor={textColor}
      textSize={textSize}
      verticalAlignment={verticalAlignment}
    >
      <CheckboxComponent
        accentColor={accentColor}
        borderRadius={borderRadius}
        isChecked={value}
        isDisabled={isDisabled}
        isLoading={false}
        isRequired={false}
        key={columnAction.id}
        label=""
        labelPosition={LabelPosition.Auto}
        onCheckChange={handleChange}
        rowSpace={5}
        widgetId={""}
      />
    </CellWrapper>
  );
};
