import React, { useEffect, useRef } from "react";
// import styled from "styled-components";
import "./styles.css";

// import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { FlexLayerLayoutData } from "utils/autoLayout/autoLayoutTypes";
// import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";
import { getAutoLayerId } from "utils/WidgetPositionsObserver/utils";
import { widgetPositionsObserver } from "utils/WidgetPositionsObserver";

/**
 * If FlexLayer hasFillWidget:
 * then render all children directly within the AutoLayoutLayer (row / flex-start / wrap);
 * no need for alignments.
 *
 * Else:
 * render children in 3 alignments: start, center and end.
 * Each alignment has following characteristics:
 * 1. Mobile viewport:
 *   - flex-wrap: wrap.
 *   - flex-basis: auto.
 *   ~ This ensures the alignment takes up as much space as needed by the children.
 *   ~ It can stretch to the full width of the viewport.
 *   ~ or collapse completely if there is no content.
 *
 * 2. Larger view ports:
 *  - flex-wrap: nowrap.
 *  - flex-basis: 0%.
 *  ~ This ensures that alignments share the total space equally, until possible.
 *  ~ Soon as the content in any alignment needs more space, it will wrap to the next line
 *    thanks to flex wrap in AutoLayoutLayer.
 */

export type AutoLayoutLayerProps = FlexLayerLayoutData & {
  index: number;
  widgetId: string;
};

function AutoLayoutLayer(props: AutoLayoutLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    widgetPositionsObserver.observeLayer(
      getAutoLayerId(props.widgetId, props.index),
      props.widgetId,
      props.index,
      ref,
    );

    return () => {
      widgetPositionsObserver.unObserveLayer(
        getAutoLayerId(props.widgetId, props.index),
      );
    };
  }, []);

  const renderChildren = () => {
    const { centerChildren, endChildren, hasFillWidget, startChildren } = props;

    /**
     * If flex layer has a fill widget,
     * then we need to render all children in a single alignment (start).
     */
    if (hasFillWidget) return startChildren;

    const arr: (JSX.Element | null)[] = [
      <div className="alignment start-alignment" key={0}>
        {startChildren}
      </div>,
      <div className="alignment center-alignment" key={1}>
        {centerChildren}
      </div>,
      <div className="alignment end-alignment" key={2}>
        {endChildren}
      </div>,
    ];

    return arr;
  };
  return (
    <div
      className={`row auto-layout-layer-${props.widgetId}-${props.index}`}
      id={getAutoLayerId(props.widgetId, props.index)}
      ref={ref}
    >
      {renderChildren()}
    </div>
  );
}

export default AutoLayoutLayer;
