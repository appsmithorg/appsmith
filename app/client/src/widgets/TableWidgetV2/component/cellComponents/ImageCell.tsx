import React from "react";
import { isString, noop } from "lodash";

import { CellWrapper } from "../TableStyledWrappers";
import { CellAlignment, VerticalAlignment } from "../Constants";
import { TextSize } from "constants/WidgetConstants";

type renderImageType = {
  value: any;
  isHidden: boolean;
  isCellVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  compactMode: string;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  textSize?: TextSize;
};

export function ImageCell(args: renderImageType) {
  const {
    compactMode,
    value,
    isHidden,
    isCellVisible,
    onClick = noop,
    allowCellWrapping,
    horizontalAlignment,
    verticalAlignment,
    cellBackground,
    fontStyle,
    textColor,
    textSize,
  } = args;

  if (!value) {
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
  } else if (!isString(value)) {
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
        <div>Invalid Image </div>
      </CellWrapper>
    );
  }
  // better regex: /(?<!base64),/g ; can't use due to safari incompatibility
  const imageSplitRegex = /[^(base64)],/g;
  const imageUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
  const base64ImageRegex = /^data:image\/.*;base64/;
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
      {value
        .toString()
        // imageSplitRegex matched "," and char before it, so add space before ","
        .replace(imageSplitRegex, (match) =>
          match.length > 1 ? `${match.charAt(0)} ,` : " ,",
        )
        .split(imageSplitRegex)
        .map((item: string, index: number) => {
          if (imageUrlRegex.test(item) || base64ImageRegex.test(item)) {
            return (
              <div
                className="image-cell-wrapper"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <div
                  className="image-cell"
                  style={{ backgroundImage: `url("${item}")` }}
                />
              </div>
            );
          } else {
            return <div key={index}>Invalid Image</div>;
          }
        })}
    </CellWrapper>
  );
}
