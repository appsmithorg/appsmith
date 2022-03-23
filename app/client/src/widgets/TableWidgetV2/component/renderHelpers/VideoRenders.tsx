import React from "react";

import { CellLayoutProperties } from "../Constants";
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
  cellProperties: CellLayoutProperties;
  isCellVisible: boolean;
};

export const renderVideo = (args: renderCellType) => {
  const { cellProperties, compactMode, isCellVisible, isHidden, value } = args;

  const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
  if (!value) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      />
    );
  } else if (isString(value) && youtubeRegex.test(value)) {
    return (
      <StyledCellWrapper
        cellProperties={cellProperties}
        className="video-cell"
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      >
        <PopoverVideo url={value} />
      </StyledCellWrapper>
    );
  } else {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        compactMode={compactMode}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
