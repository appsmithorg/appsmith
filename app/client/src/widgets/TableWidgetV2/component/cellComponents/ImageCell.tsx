import React, { useCallback, useMemo, useState } from "react";
import { isString, noop } from "lodash";
import { Tooltip } from "@blueprintjs/core";
import { TooltipContentWrapper } from "../TableStyledWrappers";
import { CellWrapper } from "../TableStyledWrappers";
import {
  TABLE_SIZES,
  type BaseCellComponentProps,
  type ImageSize,
} from "../Constants";
import { importSvg } from "@appsmith/ads-old";
import styled from "styled-components";
import type { EditableCellActions } from "widgets/TableWidgetV2/constants";
import { Colors } from "constants/Colors";
import { BasicCell } from "./BasicCell";

/*
 * Function to split the CSV of image url's
 */
function getImageArray(value: unknown) {
  // better regex: /(?<!base64),/g ; can't use due to safari incompatibility
  const imageSplitRegex = /[^(base64)],/g;

  return (
    (value as string)
      .toString()
      // imageSplitRegex matched "," and char before it, so add space before ","
      .replace(imageSplitRegex, (match) =>
        match.length > 1 ? `${match.charAt(0)} ,` : " ,",
      )
      .split(imageSplitRegex)
  );
}

type renderImageType = BaseCellComponentProps & {
  value: unknown;
  onClick?: () => void;
  isSelected?: boolean;
  imageSize?: ImageSize;
  isCellEditable?: boolean;
  isCellEditMode?: boolean;
  disabledEditIcon?: boolean;
  disabledEditIconMessage?: string;
  accentColor: string;
  toggleCellEditMode: (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit?: string,
    action?: EditableCellActions,
  ) => void;
  isEditableCellValid?: boolean;
  rowIndex?: number;
  alias?: string;
};

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

const EditIcon = importSvg(
  async () => import("assets/icons/control/edit-variant1.svg"),
);

const Wrapper = styled.div<{
  allowWrapping?: boolean;
  compactMode: string;
  isCellEditMode?: boolean;
  isEditableCellValid: boolean;
}>`
  display: flex;
  position: relative;
  align-items: center;
  width: 100%;
  height: 100%;
  border: 1px solid
    ${(props) => (!props.isEditableCellValid ? Colors.DANGER_SOLID : "#fff")};
  opacity: ${(props) => (props.isCellEditMode ? 0 : 1)};
  border: 1px solid
    ${(props) => (!props.isEditableCellValid ? "yellow" : "#fff")};

  &:hover {
    .editable-cell-icon {
      display: ${(props) => (props.isCellEditMode ? "none" : "block")};
    }
  }
`;

export function ImageCell(props: renderImageType) {
  const {
    allowCellWrapping,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    imageSize,
    isCellDisabled,
    isCellVisible,
    isHidden,
    onClick = noop,
    textColor,
    textSize,
    value,
    verticalAlignment,
    isCellEditable,
    isCellEditMode,
    disabledEditIcon,
    disabledEditIconMessage,
    accentColor,
    isEditableCellValid,
    toggleCellEditMode,
    rowIndex,
    alias

  } = props;

  const onEditHandler = useCallback(
    (e: React.MouseEvent<SVGElement | HTMLDivElement>) => {
      if (isCellEditable && !disabledEditIcon ) {
        e.stopPropagation();
        toggleCellEditMode(true,rowIndex ?? 0,alias ?? "",`${value}`)
  
      }
    },
    [ disabledEditIcon, isCellEditable],
  );

  if (!value) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        imageSize={imageSize}
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      />
    );
  } else if (!isString(value)) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        imageSize={imageSize}
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <div>Invalid Image</div>
      </CellWrapper>
    );
  }

  const imageUrlRegex =
    /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
  const base64ImageRegex = /^data:image\/.*;base64/;

  return (
    <Wrapper
      allowWrapping={allowCellWrapping}
      compactMode={compactMode}
      isCellEditMode={false}
      onDoubleClick={onEditHandler}
      isEditableCellValid={isEditableCellValid ?? false}
    >
      {isCellEditable && (
        <StyledEditIcon
          accentColor={accentColor}
          backgroundColor={cellBackground}
          className="editable-cell-icon t--editable-cell-icon"
          compactMode={compactMode}
          disabledEditIcon={disabledEditIcon ?? true}
          onMouseUp={onEditHandler}
        >
          {disabledEditIcon ? (
            <Tooltip
              autoFocus={false}
              content={
                <TooltipContentWrapper>
                  {disabledEditIconMessage}
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
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        imageSize={imageSize}
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        {getImageArray(value).map((item: string, index: number) => {
          if (imageUrlRegex.test(item) || base64ImageRegex.test(item)) {
            return (
              <div
                className="image-cell-wrapper"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <img className="image-cell" src={item} />
              </div>
            );
          } else {
            return (
              <div key={index}>Invalid Image</div>
            );
          }
        })}
      </CellWrapper>
    </Wrapper>
  );
}
