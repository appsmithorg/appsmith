import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import AutoToolTipComponent from "./AutoToolTipComponent";
import { RenderDefaultPropsType } from "../renderHelpers/DefaultRenderer";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { Colors } from "constants/Colors";
import { InlineCellEditor } from "./InlineCellEditor";
import {
  ColumnTypes,
  EditableCellActions,
} from "widgets/TableWidgetV2/constants";
import { ALIGN_ITEMS, TABLE_SIZES, VerticalAlignment } from "../Constants";
import { InputTypes } from "widgets/BaseInputWidget/constants";

const Container = styled.div<{
  isCellEditMode?: boolean;
  verticalAlignment?: VerticalAlignment;
  cellBackground?: string;
}>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: ${(props) =>
    props.verticalAlignment && ALIGN_ITEMS[props.verticalAlignment]};
  background: ${(props) => props.cellBackground};

  &:hover {
    .editable-cell-icon {
      display: ${(props) => (props.isCellEditMode ? "none" : "block")};
    }
  }
`;

const Wrapper = styled.div<{
  allowWrapping?: boolean;
  compactMode: string;
  isCellEditMode?: boolean;
}>`
  display: flex;
  position: relative;
  align-items: center;
  width: 100%;
  opacity: ${(props) => (props.isCellEditMode ? 0 : 1)};
  height: ${(props) =>
    props.allowWrapping
      ? `100%`
      : `${TABLE_SIZES[props.compactMode].ROW_HEIGHT}px`};
`;

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
`;

const StyledEditIcon = styled.div<{
  backgroundColor?: string;
  compactMode: string;
}>`
  position: absolute;
  right: 6px;
  top: ${(props) => TABLE_SIZES[props.compactMode].EDIT_ICON_TOP}px;
  background: ${Colors.GREEN};
  padding: 2px;
  cursor: pointer;
  display: none;

  & svg {
    transform: scale(0.9);

    path {
      fill: #fff;
    }
  }
`;

const UnsavedChangesMarker = styled.div`
  position: absolute;
  top: -1px;
  right: -3px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid ${Colors.GREEN_1};
  transform: rotateZ(45deg);
`;

interface PropType extends RenderDefaultPropsType {
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function TextCell({
  allowCellWrapping,
  cellBackground,
  columnType,
  compactMode,
  fontStyle,
  hasUnsavedChanged,
  horizontalAlignment,
  isCellEditable,
  isCellEditMode,
  isCellVisible,
  isHidden,
  onCellTextChange,
  tableWidth,
  textColor,
  textSize,
  toggleCellEditMode,
  value,
  verticalAlignment,
}: PropType) {
  const contentRef = useRef<HTMLDivElement>(null);

  const onEdit = useCallback(
    (e: React.MouseEvent<SVGElement | HTMLDivElement>) => {
      if (isCellEditable) {
        e.stopPropagation();
        toggleCellEditMode(true);
      }
    },
    [toggleCellEditMode],
  );

  let editor;

  if (isCellEditMode) {
    editor = (
      <InlineCellEditor
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
        inputType={
          columnType === ColumnTypes.NUMBER
            ? InputTypes.NUMBER
            : InputTypes.TEXT
        }
        multiline={
          !!contentRef.current?.offsetHeight &&
          contentRef.current?.offsetHeight > TABLE_SIZES[compactMode].ROW_HEIGHT
        }
        onChange={(text: string) => onCellTextChange(text)}
        onDiscard={() => toggleCellEditMode(false, EditableCellActions.DISCARD)}
        onSave={() => toggleCellEditMode(false, EditableCellActions.SAVE)}
        value={value}
        verticalAlignment={verticalAlignment}
      />
    );
  }

  return (
    <Container
      cellBackground={cellBackground}
      isCellEditMode={isCellEditMode}
      verticalAlignment={verticalAlignment}
    >
      <Wrapper
        allowWrapping={allowCellWrapping}
        compactMode={compactMode}
        isCellEditMode={isCellEditMode}
        onDoubleClick={onEdit}
        ref={contentRef}
      >
        {hasUnsavedChanged && <UnsavedChangesMarker />}
        <StyledAutoToolTipComponent
          allowCellWrapping={allowCellWrapping}
          cellBackground={cellBackground}
          className={isCellEditable ? "editable-cell" : ""}
          columnType={columnType}
          compactMode={compactMode}
          fontStyle={fontStyle}
          horizontalAlignment={horizontalAlignment}
          isCellVisible={isCellVisible}
          isHidden={isHidden}
          tableWidth={tableWidth}
          textColor={textColor}
          textSize={textSize}
          title={!!value ? value.toString() : ""}
          verticalAlignment={verticalAlignment}
        >
          {value}
        </StyledAutoToolTipComponent>
        {isCellEditable && (
          <StyledEditIcon
            backgroundColor={cellBackground}
            className="editable-cell-icon"
            compactMode={compactMode}
            onMouseUp={onEdit}
          >
            <EditIcon />
          </StyledEditIcon>
        )}
      </Wrapper>
      {editor}
    </Container>
  );
}
