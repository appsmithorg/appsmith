import React, { useCallback } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import {
  FixedSizeList as List,
  ListChildComponentProps,
  areEqual,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import isEqual from "lodash/isEqual";

type Props = {
  src: Record<string, any>;
  panelRef: any;
};

const OutputContainer = styled.div`
  background: #f5f6f7;
  border: 1px solid #d0d7dd;
  box-sizing: border-box;
  padding: 6px;
`;

const ResponseContent = styled.div`
  overflow: auto;
`;

// const Record = styled(Card)`
//   margin: 5px;
//   border-radius: 0;
//   span.string-value {
//     overflow-wrap: anywhere;
//   }
// `;

function VirtualizedJsonViewer(props: Props) {
  const { panelRef, src } = props;

  const panel = props.panelRef.current;

  const reactJsonProps = {
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    collapsed: 1,
    style: { fontSize: "14px" },
  };

  type rowRenderProps = {
    index: number;
    key: number;
    style: any;
  };

  // eslint-disable-next-line react/display-name
  const renderReactJson = ({ data, index, style }: any) => {
    const itemData = data[index];
    console.log("prev", index);
    return (
      <div
        key={index}
        style={{
          ...style,
          top: `${parseFloat(style?.top) + 40}px`,
          height: `${parseFloat(style?.height) + 40}px`,
        }}
      >
        {/* <ReactJson key={index} src={data[index]} {...reactJsonProps} /> */}
        <pre style={{ height: "auto" }}>{JSON.stringify(itemData)}</pre>
      </div>
    );
  };
  //   );
  //   const memoizedRenderReactJson = useCallback(
  //     (props: any) => renderReactJson(props),
  //     [],
  //   );

  return (
    <div
      style={{
        display: "block",
        height: "100%",
        width: "auto",
        position: "relative",
      }}
    >
      <AutoSizer>
        {({ height, width }) => (
          <List
            // height={panel.getBoundingClientRect().height}
            height={height}
            itemCount={src.length}
            itemData={src}
            itemSize={5}
            //   rowRenderer={renderReactJson}
            // overscanCount={10}
            // width={panel.getBoundingClientRect().width}
            width={width}
          >
            {renderReactJson}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default VirtualizedJsonViewer;
