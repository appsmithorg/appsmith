/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import SyntaxHighlighter from "react-syntax-highlighter";
import customJsonViewerStyles from "./VirtualizedJsonViewerStyles";
import { isArray } from "lodash";

type Props = {
  src: Record<string, any> | unknown;
};

const HighlightContainer = styled.div`
  display: block;
  margin: 0;

  & .highlighter span {
    font-family: monospace;
  }
`;

function VirtualizedJsonViewer(props: Props) {
  const { src } = props;

  // regex to convert stringified integers back to actual integers.
  const REGEX = /"(-|)([0-9]+(?:\.[0-9]+)?)"/g;

  // ref value for the Variable Size List.
  const listRef: any = useRef({});

  // object to store all the heights of every row element to be rendered.
  let rowHeights: Record<string, number> = {};

  type rowRenderProps = {
    index: number;
    style: any;
  };

  function getRowHeight(index: number) {
    // get the row height of the current index from our rowHeights.
    return rowHeights[index] || 200;
  }

  const setRowHeight = (index: number, size: number) => {
    // this will make react window Virtualized list recalculate the height of the row elements.
    listRef.current.resetAfterIndex(0);

    // store the height of the row element in the rowHeights object.
    rowHeights = { ...rowHeights, [index]: size };
  };

  const renderReactJson = ({ index, style }: rowRenderProps) => {
    // ref value for the current row element.
    const rowRef: any = useRef({});

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [rowRef]);

    if (!isArray(src)) return <div> No Element here </div>;

    // stringify item object.
    const stringifiedItemData = JSON.stringify(src[index], null, 2);
    // convert stringified json numbers back to actual numbers for proper highlighting.
    const itemData = stringifiedItemData.replace(REGEX, "$1$2");

    return (
      <div key={index} style={style}>
        <HighlightContainer
          ref={rowRef}
          style={{
            height: "auto",
          }}
        >
          <SyntaxHighlighter
            className="highlighter"
            customStyle={{
              paddingTop: "0px",
              paddingBottom: "0px",
              fontSize: "14px",
              letterSpacing: "0.5px",
            }}
            language="json"
            style={customJsonViewerStyles}
          >
            {/* {`${index === 0 ? "[\n" : ""}${JSON.stringify(itemData, null, 2)},${
              index === src.length - 1 ? "\n]" : ""
            }`} */}
            {/* {`${JSON.stringify(itemData, null, 2)}`} */}
            {itemData}
          </SyntaxHighlighter>
          {/* <ReactJson id={index} src={itemData} {...reactJsonProps} /> */}
        </HighlightContainer>
      </div>
    );
  };

  if (!src) {
    return null;
  }

  // if it is not an array render just one item.
  if (!isArray(src)) {
    return (
      <HighlightContainer
        style={{
          height: "auto",
        }}
      >
        <SyntaxHighlighter
          className="highlighter"
          customStyle={{
            paddingTop: "0px",
            paddingBottom: "0px",
            fontSize: "14px",
            letterSpacing: "0.5px",
          }}
          language="json"
          style={customJsonViewerStyles}
        >
          {`${JSON.stringify(src, null, 2)}`}
        </SyntaxHighlighter>
      </HighlightContainer>
    );
  }

  return (
    <div
      style={{
        display: "block",
        height: "100%",
        width: "auto",
        position: "relative",
      }}
    >
      {isArray(src) && (
        <AutoSizer>
          {({ height, width }) => (
            <List
              // remove 5(could be any number) from the auto generated height to prevent incessant re-rendering by the list.
              // kind of like an offset value to be specific.
              height={height - 5}
              itemCount={src.length}
              itemData={src}
              itemSize={getRowHeight}
              ref={listRef}
              width={width}
            >
              {renderReactJson}
            </List>
          )}
        </AutoSizer>
      )}
    </div>
  );
}

export default VirtualizedJsonViewer;
