import React, { useMemo } from "react";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";
import styled from "styled-components";
import type { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";
import LinkFilter from "widgets/TextWidget/component/filters/LinkFilter";
import { countOccurrences } from "workers/Evaluation/helpers";

const MAX_HTML_PARSING_LENGTH = 1000;

const HTMLContent = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;

  ul {
    list-style-type: disc;
    list-style-position: inside;
  }

  ol {
    list-style-type: decimal;
    list-style-position: inside;
  }

  h1 {
    font-size: 2em;
    margin: 0.67em 0;
  }
  h2 {
    font-size: 1.5em;
    margin: 0.75em 0;
  }
  h3 {
    font-size: 1.17em;
    margin: 0.83em 0;
  }
  h5 {
    font-size: 0.83em;
    margin: 1.5em 0;
  }
  h6 {
    font-size: 0.75em;
    margin: 1.67em 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: bold;
  }

  a {
    color: #106ba3;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
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

  const shouldDisableLink = useMemo(() => {
    const text = value || "";
    const count: number = countOccurrences(text, "\n", false, 0);

    return (
      (count === 0 && text.length > MAX_HTML_PARSING_LENGTH) ||
      text.length > 50000
    );
  }, [value]);

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
      <HTMLContent>
        <Interweave
          content={value}
          filters={[new LinkFilter()]}
          matchers={
            shouldDisableLink
              ? []
              : [new EmailMatcher("email"), new UrlMatcher("url")]
          }
          newWindow
        />
      </HTMLContent>
    </CellWrapper>
  );
}
