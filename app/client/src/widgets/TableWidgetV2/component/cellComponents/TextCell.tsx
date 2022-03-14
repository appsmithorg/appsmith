import React, { useCallback } from "react";
import styled, { css } from "styled-components";
import AutoToolTipComponent from "../AutoToolTipComponent";
import { renderDefaultPropsType } from "../renderHelpers/DefaultRenderer";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { Colors } from "constants/Colors";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const EDIT_ICON_WIDTH = "30px";

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
`;

const StyledEditIcon = styled(EditIcon)`
  flex-basis: ${EDIT_ICON_WIDTH};
  cursor: pointer;
  height: 12px;
  display: none;

  & path {
    fill: ${Colors.GREEN_1};
  }
`;

export const EditableRowHoverStyle = css`
  &:hover {
    .editable-cell {
      width: calc(100% - ${EDIT_ICON_WIDTH});
    }

    .editable-cell-icon {
      display: block;
    }
  }
`;

type TextCellProps = Omit<
  renderDefaultPropsType,
  "onCellTextChange" | "isCellEditMode"
>;

export function TextCell({
  cellProperties,
  columnType,
  isCellEditable,
  isCellVisible,
  isHidden,
  tableWidth,
  toggleCellEditMode,
  value,
}: TextCellProps) {
  const onEdit = useCallback(
    (e: React.MouseEvent<SVGElement | HTMLDivElement>) => {
      e.stopPropagation();
      toggleCellEditMode(true);
    },
    [toggleCellEditMode],
  );

  return (
    <Wrapper onDoubleClick={onEdit}>
      <StyledAutoToolTipComponent
        cellProperties={cellProperties}
        className={isCellEditable ? "editable-cell" : ""}
        columnType={columnType}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        title={!!value ? value.toString() : ""}
      >
        {value}
      </StyledAutoToolTipComponent>
      {isCellEditable && (
        <StyledEditIcon className="editable-cell-icon" onClick={onEdit} />
      )}
    </Wrapper>
  );
}
