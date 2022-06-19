import React from "react";
import { isString, noop } from "lodash";

import { CellWrapper } from "../TableStyledWrappers";
import { BaseCellComponentProps } from "../Constants";

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
};

export function ImageCell(props: renderImageType) {
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
  } = props;

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
      {getImageArray(value).map((item: string, index: number) => {
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
