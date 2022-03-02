import React from "react";

import { CellLayoutProperties } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import { isString } from "lodash";

type renderCellType = {
  value: any;
  isHidden: boolean;
  cellProperties: CellLayoutProperties;
  isCellVisible: boolean;
};

export const renderVideo = (args: renderCellType) => {
  const { cellProperties, isCellVisible, isHidden, value } = args;

  const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
  if (!value) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      />
    );
  } else if (isString(value) && youtubeRegex.test(value)) {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        className="video-cell"
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      >
        <PopoverVideo url={value} />
      </CellWrapper>
    );
  } else {
    return (
      <CellWrapper
        cellProperties={cellProperties}
        isCellVisible={isCellVisible}
        isHidden={isHidden}
      >
        Invalid Video Link
      </CellWrapper>
    );
  }
};
