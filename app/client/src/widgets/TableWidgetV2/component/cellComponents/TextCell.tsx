import React, { useCallback, useRef } from "react";
import styled, { css } from "styled-components";
import AutoToolTipComponent from "../AutoToolTipComponent";
import { RenderDefaultPropsType } from "../renderHelpers/DefaultRenderer";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { Colors } from "constants/Colors";
import { InlineCellEditor } from "./InlineCellEditor";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { TABLE_SIZES } from "../Constants";

const Container = styled.div`
  height: 100%;
  width: 100%;
`;

const Wrapper = styled.div<{ isCellEditMode?: boolean }>`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  opacity: ${(props) => (props.isCellEditMode ? 0 : 1)};
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
  background: ${Colors.GREEN_1};
  padding: 3px;
  cursor: pointer;
  border-radius: 3px;
  display: none;

  & path {
    fill: #fff;
  }
`;

export const EditableRowHoverStyle = css`
  &:hover {
    .editable-cell-icon {
      display: block;
    }
  }
`;

interface PropType extends RenderDefaultPropsType {
  onChange: (text: string) => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function TextCell({
  cellProperties,
  columnType,
  compactMode,
  isCellEditable,
  isCellEditMode,
  isCellVisible,
  isHidden,
  onCellTextChange,
  tableWidth,
  toggleCellEditMode,
  value,
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
        compactMode={compactMode}
        multiline={
          !!contentRef.current?.offsetHeight &&
          contentRef.current?.offsetHeight > TABLE_SIZES[compactMode].ROW_HEIGHT
        }
        onChange={(text: string) => onCellTextChange(text)}
        onDiscard={() => toggleCellEditMode(false, EditableCellActions.DISCARD)}
        onSave={() => toggleCellEditMode(false, EditableCellActions.SAVE)}
        value={value}
      />
    );
  }

  return (
    <Container>
      <Wrapper
        isCellEditMode={isCellEditMode}
        onDoubleClick={onEdit}
        ref={contentRef}
      >
        <StyledAutoToolTipComponent
          allowWrapping={cellProperties.allowCellWrapping}
          cellProperties={cellProperties}
          className={isCellEditable ? "editable-cell" : ""}
          columnType={columnType}
          compactMode={compactMode}
          isCellVisible={isCellVisible}
          isHidden={isHidden}
          tableWidth={tableWidth}
          title={!!value ? value.toString() : ""}
        >
          {value}
        </StyledAutoToolTipComponent>
        {isCellEditable && (
          <StyledEditIcon
            backgroundColor={cellProperties.cellBackground}
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
