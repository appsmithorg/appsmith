import React from "react";
import { isString, noop } from "lodash";

import { CellWrapper } from "../TableStyledWrappers";
import { CellLayoutProperties } from "../Constants";

type renderImageType = {
  value: any;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  isCellVisible: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  compactMode: string;
};

export const renderImage = (args: renderImageType) => {
  const {
    compactMode,
    value,
    isHidden,
    cellProperties,
    isCellVisible,
    onClick = noop,
    isSelected,
  } = args;

  if (!value) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      />
    );
  } else if (!isString(value)) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
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
      cellProperties={cellProperties}
      compactMode={compactMode}
      isCellVisible={isCellVisible}
      isHidden={isHidden}
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
                  if (isSelected) {
                    e.stopPropagation();
                  }
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
};
