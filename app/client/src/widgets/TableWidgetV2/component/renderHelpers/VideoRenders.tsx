import React from "react";

import { CellAlignment, VerticalAlignment } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";
import styled from "constants/DefaultTheme";

const StyledCellWrapper = styled(CellWrapper)`
  & {
    .play-icon {
      position: static;
    }
  }
`;

type renderCellType = {
  compactMode: string;
  value: any;
  isHidden: boolean;
  isCellVisible: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
};

export const VideoCell = (props: renderCellType) => {
  const {
    allowCellWrapping,
    compactMode,
    horizontalAlignment,
    isCellVisible,
    isHidden,
    value,
    verticalAlignment,
  } = props;

  const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
  if (!value) {
    return (
      <CellWrapper
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
      />
    );
  } else if (isString(value) && youtubeRegex.test(value)) {
    return (
      <StyledCellWrapper
        allowCellWrapping={allowCellWrapping}
        className="video-cell"
        compactMode={compactMode}
        horizontalAlignment={horizontalAlignment}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
        verticalAlignment={verticalAlignment}
      >
        <PopoverVideo url={value} />
      </StyledCellWrapper>
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
