import Interweave from "interweave";
import React, { useMemo } from "react";
import styled from "styled-components";
import LinkFilter from "widgets/TextWidget/component/filters/LinkFilter";
import type { BaseCellComponentProps } from "../Constants";
import { CellWrapper } from "../TableStyledWrappers";

const HTMLContainer = styled.div`
  & {
    height: 100%;
    width: 100%;
    position: relative;
  }
  ul {
    list-style-type: disc;
    list-style-position: inside;
  }
  ol {
    list-style-type: decimal;
    list-style-position: inside;
  }
  ul ul,
  ol ul {
    list-style-type: circle;
    list-style-position: inside;
    margin-left: 15px;
  }
  ol ol,
  ul ol {
    list-style-type: lower-latin;
    list-style-position: inside;
    margin-left: 15px;
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

const HTMLCell = (props: HTMLCellProps) => {
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

  const interweaveCompatibleValue = useMemo(convertToInterweaveString(value), [
    value,
  ]);

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
      <HTMLContainer data-testid="t--table-widget-v2-html-cell">
        <Interweave
          content={interweaveCompatibleValue}
          filters={[new LinkFilter()]}
          newWindow
        />
      </HTMLContainer>
    </CellWrapper>
  );
};

export default HTMLCell;

function convertToInterweaveString(value: string): () => string {
  return () => {
    if (value === null || value === undefined) return "";

    // this conversion is specifically required for Number type values
    return String(value);
  };
}
