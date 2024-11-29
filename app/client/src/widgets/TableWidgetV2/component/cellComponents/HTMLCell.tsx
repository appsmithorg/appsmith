import React, { useMemo } from "react";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";
import styled from "styled-components";
import {
  TABLE_SIZES,
  type BaseCellComponentProps,
  type CompactMode,
} from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import LinkFilter from "widgets/TextWidget/component/filters/LinkFilter";
import { countOccurrences } from "workers/Evaluation/helpers";

const MAX_HTML_PARSING_LENGTH = 1000;

const ContentWrapper = styled.div<{
  allowCellWrapping?: boolean;
  compactMode: CompactMode;
}>`
  width: 100%;
  display: flex;
  align-items: center;

  ${(props) =>
    props.allowCellWrapping
      ? `
        white-space: break-spaces;
        word-break: break-word;
        height: 100%;
      `
      : `
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      height: ${TABLE_SIZES[props.compactMode].ROW_HEIGHT}px};
      `}
`;

export interface HTMLCellProps extends BaseCellComponentProps {
  value: string;
  fontSize?: string;
}

export function HTMLCell(props: HTMLCellProps) {
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

  const inteweaveCompatibleValue = useMemo(() => {
    if (value === null || value === undefined) return "";

    return String(value);
  }, [value]);

  const shouldDisableLink = useMemo(() => {
    const count: number = countOccurrences(
      inteweaveCompatibleValue,
      "\n",
      false,
      0,
    );

    return (
      (count === 0 &&
        inteweaveCompatibleValue.length > MAX_HTML_PARSING_LENGTH) ||
      inteweaveCompatibleValue.length > 50000
    );
  }, [inteweaveCompatibleValue]);

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
    >
      <ContentWrapper
        allowCellWrapping={allowCellWrapping}
        compactMode={compactMode}
      >
        <Interweave
          content={inteweaveCompatibleValue}
          filters={[new LinkFilter()]}
          matchers={
            shouldDisableLink
              ? []
              : [new EmailMatcher("email"), new UrlMatcher("url")]
          }
          newWindow
        />
      </ContentWrapper>
    </CellWrapper>
  );
}
