import React from "react";

import { BaseCellComponentProps, TableSizes } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";
import { YOUTUBE_URL_REGEX } from "widgets/constants";

type renderCellType = BaseCellComponentProps & {
  value: unknown;
  tableSizes: TableSizes;
};

export const VideoCell = (props: renderCellType) => {
  const {
    allowCellWrapping,
    cellBackground,
    compactMode,
    fontStyle,
    horizontalAlignment,
    isCellDisabled,
    isCellVisible,
    isHidden,
    textColor,
    textSize,
    value,
    verticalAlignment,
    tableSizes,
  } = props;

  if (!value) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        cellBackground={cellBackground}
        compactMode={compactMode}
        fontStyle={fontStyle}
        horizontalAlignment={horizontalAlignment}
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
        tableSizes={tableSizes}
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
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        textColor={textColor}
        textSize={textSize}
        verticalAlignment={verticalAlignment}
        tableSizes={tableSizes}
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
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
        tableSizes={tableSizes}
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
