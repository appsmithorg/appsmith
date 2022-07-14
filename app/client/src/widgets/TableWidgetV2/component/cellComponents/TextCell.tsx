import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import { Tooltip } from "@blueprintjs/core";
import AutoToolTipComponent from "./AutoToolTipComponent";
import { RenderDefaultPropsType } from "./DefaultCell";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { InlineCellEditor } from "./InlineCellEditor";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { ALIGN_ITEMS, TABLE_SIZES, VerticalAlignment } from "../Constants";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { CELL_WRAPPER_LINE_HEIGHT } from "../TableStyledWrappers";
import { TooltipContentWrapper } from "../TableStyledWrappers";

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
  height: 100%;
  opacity: ${(props) => (props.isCellEditMode ? 0 : 1)};
`;

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
`;

const StyledEditIcon = styled.div<{
  accentColor?: string;
  backgroundColor?: string;
  compactMode: string;
  disabledEditIcon: boolean;
}>`
  position: absolute;
  right: 6px;
  top: ${(props) => TABLE_SIZES[props.compactMode].EDIT_ICON_TOP}px;
  background: ${(props) =>
    props.disabledEditIcon ? "#999" : props.accentColor};
  padding: 2px;
  cursor: ${(props) => (props.disabledEditIcon ? "default" : "pointer")};
  display: none;

  & svg {
    transform: scale(0.9);

    path {
      fill: #fff;
    }
  }
`;

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

const Content = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface PropType extends RenderDefaultPropsType {
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export function TextCell({
  accentColor,
  allowCellWrapping,
  cellBackground,
  columnType,
  compactMode,
  disabledEditIcon,
  fontStyle,
  hasUnsavedChanged,
  horizontalAlignment,
  isCellEditable,
  isCellEditMode,
  isCellVisible,
  isHidden,
  onChange,
  onDiscard,
  onEdit,
  onSave,
  tableWidth,
  textColor,
  textSize,
  toggleCellEditMode,
  value,
  verticalAlignment,
}: PropType) {
  const contentRef = useRef<HTMLDivElement>(null);

  const onEditHandler = useCallback(
    (e: React.MouseEvent<SVGElement | HTMLDivElement>) => {
      if (isCellEditable && !disabledEditIcon) {
        e.stopPropagation();
        onEdit();
      }
    },
    [toggleCellEditMode, onEdit],
  );

  let editor;

  if (isCellEditMode) {
    const isMultiline =
      !!contentRef.current?.offsetHeight &&
      contentRef.current?.offsetHeight / CELL_WRAPPER_LINE_HEIGHT > 1;

    editor = (
      <InlineCellEditor
        accentColor={accentColor}
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
        inputType={
          columnType === ColumnTypes.NUMBER
            ? InputTypes.NUMBER
            : InputTypes.TEXT
        }
        multiline={isMultiline}
        onChange={onChange}
        onDiscard={onDiscard}
        onSave={onSave}
        textSize={textSize}
        value={value}
        verticalAlignment={verticalAlignment}
      />
    );
  }

  return (
    <Container
      cellBackground={cellBackground}
      className="t--table-text-cell"
      isCellEditMode={isCellEditMode}
      verticalAlignment={verticalAlignment}
    >
      <Wrapper
        allowWrapping={allowCellWrapping}
        compactMode={compactMode}
        isCellEditMode={isCellEditMode}
        onDoubleClick={onEditHandler}
      >
        {hasUnsavedChanged && (
          <UnsavedChangesMarker accentColor={accentColor} />
        )}
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
          <Content ref={contentRef}>{value}</Content>
        </StyledAutoToolTipComponent>
        {isCellEditable && (
          <StyledEditIcon
            accentColor={accentColor}
            backgroundColor={cellBackground}
            className="editable-cell-icon t--editable-cell-icon"
            compactMode={compactMode}
            disabledEditIcon={disabledEditIcon}
            onMouseUp={onEditHandler}
          >
            {disabledEditIcon ? (
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
                <EditIcon onClick={(e) => e.stopPropagation()} />
              </Tooltip>
            ) : (
              <EditIcon onClick={(e) => e.stopPropagation()} />
            )}
          </StyledEditIcon>
        )}
      </Wrapper>
      {editor}
    </Container>
  );
}
