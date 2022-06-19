import React from "react";

import { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";
import { YOUTUBE_URL_REGEX } from "widgets/constants";

type renderCellType = BaseCellComponentProps & {
  value: unknown;
};

export const VideoCell = (props: renderCellType) => {
  const {
    allowCellWrapping,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellVisible,
    isHidden,
    textColor,
    textSize,
    value,
    verticalAlignment,
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
  } else if (isString(value) && YOUTUBE_URL_REGEX.test(value)) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        className="video-cell"
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
      >
        <PopoverVideo url={value} />
      </CellWrapper>
    );
  } else {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
