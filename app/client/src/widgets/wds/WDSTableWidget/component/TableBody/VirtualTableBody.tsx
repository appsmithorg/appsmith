import React from "react";
import { useLayoutEffect, useRef } from "react";
import type { VirtualTableBodyProps } from "./types";

import { FixedSizeList, areEqual } from "react-window";
import type { ListChildComponentProps } from "react-window";
import { Row, EmptyRow } from "./Row";

export const VirtualTableBody = (props: VirtualTableBodyProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [horizontalScrollbarHeight, setHorizontalScrollbarHeight] =
    React.useState(0);

  useLayoutEffect(() => {
    if (ref.current) {
      const horizontalScrollbar = ref.current;
      if (horizontalScrollbar) {
        setHorizontalScrollbarHeight(
          horizontalScrollbar.offsetHeight - horizontalScrollbar.clientHeight,
        );
      }
    }
  }, [ref.current]);

  return (
    <FixedSizeList
      data-virtual-list=""
      height={props.height + 40 + horizontalScrollbarHeight}
      innerElementType={props.innerElementType}
      itemCount={Math.max(props.rows.length, props.pageSize)}
      itemData={props.rows}
      itemSize={40}
      outerRef={ref}
      style={{
        overflow: "auto",
        scrollbarColor: "initial",
      }}
      width="100cqw"
    >
      {rowRenderer}
    </FixedSizeList>
  );
};

const rowRenderer = React.memo((rowProps: ListChildComponentProps) => {
  const { data, index, style } = rowProps;

  if (index < data.length) {
    const row = data[index];

    return (
      <Row
        className="t--virtual-row"
        index={index}
        key={index}
        row={row}
        style={style}
      />
    );
  } else {
    return <EmptyRow style={style} />;
  }
}, areEqual);
