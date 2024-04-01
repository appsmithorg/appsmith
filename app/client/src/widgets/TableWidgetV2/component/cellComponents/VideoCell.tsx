import React, { useContext } from "react";

import type { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";
import { YOUTUBE_URL_REGEX } from "WidgetProvider/constants";
import { TableContext } from "widgets/TableWidgetV2/widget";

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
    isCellDisabled,
    isCellVisible,
    isHidden,
    textColor,
    textSize,
    value,
    verticalAlignment,
  } = props;

  const tableDimensions = useContext(TableContext).tableDimensions;

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
        tableDimensions={tableDimensions}
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
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableDimensions={tableDimensions}
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
        isCellDisabled={isCellDisabled}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        tableDimensions={tableDimensions}
        verticalAlignment={verticalAlignment}
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
