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
  columnActions?: ColumnAction[];
  value: boolean;
  accentColor: string;
  isDisabled?: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  borderRadius: string;
};

type CheckboxComponentPartialProps = Omit<
  CheckboxComponentProps,
  "onCheckChange" | "isChecked"
>;

export const Checkbox = (
  props: CheckboxComponentPartialProps & {
    onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
    action: ColumnAction;
    value: boolean;
  },
) => {
  const {
    accentColor,
    action,
    borderRadius,
    isDisabled,
    onCommandClick,
    value,
  } = props;

  const handleChange = () => {
    onCommandClick(action.dynamicTrigger, noop);
  };
  return (
    <CheckboxComponent
      accentColor={accentColor}
      borderRadius={borderRadius}
      isChecked={value}
      isDisabled={isDisabled}
      isLoading={false}
      isRequired={false}
      label=""
      labelPosition={LabelPosition.Auto}
      onCheckChange={handleChange}
      rowSpace={5}
      widgetId={""}
    />
  );
};

export const CheckboxCellWrapper = (props: renderCellType) => {
  const {
    accentColor,
    allowCellWrapping,
    borderRadius,
    cellBackground,
    columnActions,
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

  if (!columnActions) {
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
      />
    );
  }
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
      {columnActions.map((action: ColumnAction, index: number) => {
        return (
          <Checkbox
            accentColor={accentColor}
            action={action}
            borderRadius={borderRadius}
            isDisabled={isDisabled}
            isLoading={false}
            isRequired={false}
            key={index}
            label=""
            labelPosition={LabelPosition.Auto}
            onCommandClick={onCommandClick}
            rowSpace={5}
            value={value}
            widgetId=""
          />
        );
      })}
    </CellWrapper>
  );
};
