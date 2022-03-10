import React, { useCallback } from "react";
import styled from "styled-components";
import AutoToolTipComponent from "../AutoToolTipComponent";
import { renderDefaultPropsType } from "../renderHelpers/DefaultRenderer";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const EDIT_ICON_WIDTH = "20px";

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  flex-basis: calc(100% - ${EDIT_ICON_WIDTH});
`;

const StyledEditIcon = styled(EditIcon)`
  flex-basis: ${EDIT_ICON_WIDTH};
  cursor: pointer;
`;

type TextCellProps = Omit<
  renderDefaultPropsType,
  "onCellTextChange" | "isCellEditMode"
>;

export function TextCell({
  cellProperties,
  columnType,
  isCellVisible,
  isHidden,
  tableWidth,
  toggleCellEditMode,
  value,
}: TextCellProps) {
  const onIconClick = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      e.stopPropagation();
      toggleCellEditMode(true);
    },
    [toggleCellEditMode],
  );

  return (
    <Wrapper>
      <StyledAutoToolTipComponent
        cellProperties={cellProperties}
        columnType={columnType}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableWidth={tableWidth}
        title={!!value ? value.toString() : ""}
      >
        <div onClick={() => toggleCellEditMode(true)}>{value}</div>
      </StyledAutoToolTipComponent>
      <StyledEditIcon onClick={onIconClick} />
    </Wrapper>
  );
}
