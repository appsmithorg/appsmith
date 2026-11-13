import React from "react";
import styled from "styled-components";

import type { BaseCellComponentProps } from "../Constants";
import {
  CompactModeTypes,
  TABLE_CELL_ACTION_VERTICAL_PADDING,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";
import { YOUTUBE_URL_REGEX } from "WidgetProvider/constants";

const ActionCellWrapper = styled(CellWrapper)<{ compactMode?: string }>`
  padding: ${({ compactMode }) =>
    compactMode === CompactModeTypes.SHORT
      ? "0 10px"
      : `${TABLE_CELL_ACTION_VERTICAL_PADDING}px 10px`};
`;

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
      />
    );
  } else if (isString(value) && YOUTUBE_URL_REGEX.test(value)) {
    return (
      <ActionCellWrapper
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
      >
        <PopoverVideo url={value} />
      </ActionCellWrapper>
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
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
