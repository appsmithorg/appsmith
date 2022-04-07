import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import AutoToolTipComponent from "./AutoToolTipComponent";
import { RenderDefaultPropsType } from "../renderHelpers/DefaultRenderer";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { Colors } from "constants/Colors";
import { InlineCellEditor } from "./InlineCellEditor";
import { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { ALIGN_ITEMS, CellLayoutProperties, TABLE_SIZES } from "../Constants";

const Container = styled.div<{
  cellProperties: CellLayoutProperties;
  isCellEditMode?: boolean;
}>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: ${(props) =>
    props.cellProperties.verticalAlignment &&
    ALIGN_ITEMS[props.cellProperties.verticalAlignment]};
  background: ${(props) => props?.cellProperties?.cellBackground};

  &:hover {
    .editable-cell-icon {
      display: ${(props) => (props.isCellEditMode ? "none" : "block")};
    }
  }
`;

const Wrapper = styled.div<{
  allowWrapping: boolean;
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
  background: ${Colors.GREEN_1};
  padding: 3px;
  cursor: pointer;
  border-radius: 3px;
  display: none;

  & path {
    fill: #fff;
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
        cellProperties={cellProperties}
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
    <Container cellProperties={cellProperties} isCellEditMode={isCellEditMode}>
      <Wrapper
        allowWrapping={cellProperties.allowCellWrapping}
        compactMode={compactMode}
        isCellEditMode={isCellEditMode}
        onDoubleClick={onEdit}
        ref={contentRef}
      >
        {cellProperties.hasUnsavedChanged && <UnsavedChangesMarker />}
        <StyledAutoToolTipComponent
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
