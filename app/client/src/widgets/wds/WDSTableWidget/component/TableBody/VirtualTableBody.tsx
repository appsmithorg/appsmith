import React, { useCallback } from "react";
import { useLayoutEffect, useRef } from "react";
import type { VirtualTableBodyProps } from "./types";

import { FixedSizeList, areEqual } from "react-window";
import type { ListChildComponentProps } from "react-window";
import { Row, EmptyRow } from "./Row";
import { useResizeObserver } from "@react-aria/utils";

export const VirtualTableBody = (props: VirtualTableBodyProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [horizontalScrollbarHeight, setHorizontalScrollbarHeight] =
    React.useState(0);
  const [itemHeight, setItemHeight] = React.useState("0px");
  const [headerHeight, setHeaderHeight] = React.useState("0px");

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

  useLayoutEffect(() => {
    if (ref.current) {
      const table = ref.current.closest("[role='table']");

      if (table && table instanceof HTMLElement) {
        const style = window.getComputedStyle(table);

        const thHeight = style.getPropertyValue("background-position-x");
        const trHeight = style.getPropertyValue("background-position-y");

        setHeaderHeight(thHeight);
        setItemHeight(trHeight);
      }
    }
  }, [props.pageSize, ref.current]);

  const onSizeChange = useCallback(() => {
    if (ref.current) {
      const table = ref.current.closest("[role='table']");

      if (table && table instanceof HTMLElement) {
        const style = window.getComputedStyle(table);

        const thHeight = style.getPropertyValue("background-position-x");
        const trHeight = style.getPropertyValue("background-position-y");

        setHeaderHeight(thHeight);
        setItemHeight(trHeight);
      }
    }
  }, [props.pageSize, ref.current]);

  useResizeObserver({
    ref: ref,
    onResize: onSizeChange,
  });

  return (
    <FixedSizeList
      data-virtual-list=""
      height={
        props.pageSize * parseFloat(itemHeight) +
        parseFloat(headerHeight) +
        horizontalScrollbarHeight
      }
      innerElementType={props.innerElementType}
      itemCount={Math.max(props.rows.length, props.pageSize)}
      itemData={props.rows}
      itemSize={parseFloat(itemHeight)}
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
