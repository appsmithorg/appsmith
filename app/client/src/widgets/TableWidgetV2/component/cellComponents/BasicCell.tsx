import React, { Ref, useCallback } from "react";
import { Tooltip } from "@blueprintjs/core";
import styled from "styled-components";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { BaseCellComponentProps, TABLE_SIZES } from "../Constants";
import { TooltipContentWrapper } from "../TableStyledWrappers";
import AutoToolTipComponent from "./AutoToolTipComponent";

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

  &:hover {
    .editable-cell-icon {
      display: ${(props) => (props.isCellEditMode ? "none" : "block")};
    }
  }
`;

const StyledAutoToolTipComponent = styled(AutoToolTipComponent)`
  width: 100%;
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

type PropType = BaseCellComponentProps & {
  accentColor: string;
  value: any;
  columnType: string;
  tableWidth: number;
  isCellEditable?: boolean;
  isCellEditMode?: boolean;
  hasUnsavedChanges?: boolean;
  displayText?: string;
  disabledEditIcon: boolean;
  onEdit?: () => void;
  url?: string;
};

export const BasicCell = React.forwardRef(
  (
    {
      accentColor,
      allowCellWrapping,
      cellBackground,
      columnType,
      compactMode,
      disabledEditIcon,
      fontStyle,
      hasUnsavedChanges,
      horizontalAlignment,
      isCellEditable,
      isCellEditMode,
      isCellVisible,
      isHidden,
      onEdit,
      tableWidth,
      textColor,
      textSize,
      url,
      value,
      verticalAlignment,
    }: PropType,
    contentRef: Ref<HTMLDivElement>,
  ) => {
    const onEditHandler = useCallback(
      (e: React.MouseEvent<SVGElement | HTMLDivElement>) => {
        if (isCellEditable && !disabledEditIcon && onEdit) {
          e.stopPropagation();
          onEdit();
        }
      },
      [onEdit, disabledEditIcon, isCellEditable],
    );

    return (
      <Wrapper
        allowWrapping={allowCellWrapping}
        compactMode={compactMode}
        isCellEditMode={isCellEditMode}
        onDoubleClick={onEditHandler}
      >
        {hasUnsavedChanges && (
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
          url={url}
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
    );
  },
);
