import React, { useEffect, useRef } from "react";
import { clamp } from "lodash-es";
import swap from "lodash-move";
import { useDrag } from "react-use-gesture";
import { useSprings, animated, interpolate } from "react-spring";
import styled from "styled-components";
import { debounce, get } from "lodash";

interface SpringStyleProps {
  down: boolean;
  originalIndex: number;
  curIndex: number;
  y: number;
  itemHeight: number;
}

// Styles when new items are added/removed/updated coz of parent component update.
const updateSpringStyles = (
  order: Array<number>,
  itemHeight: number,
  immediate = true,
) => (index: number) => {
  return {
    y: order.indexOf(index) * itemHeight,
    scale: 1,
    zIndex: "0",
    shadow: 1,
    immediate,
  };
};

// Styles when items are dragged/idle
const dragIdleSpringStyles = (
  order: Array<number>,
  { curIndex, down, itemHeight, originalIndex, y }: SpringStyleProps,
) => (index: number) => {
  // picked/dragged item style
  if (down && index === originalIndex) {
    return {
      y: curIndex * itemHeight + y,
      scale: 1,
      zIndex: "1",
      shadow: 15,
      immediate: true,
    };
  } else {
    return updateSpringStyles(order, itemHeight, false)(index);
  }
};

const DraggableListWrapper = styled.div`
  user-select: none;
  position: relative;
  & > div {
    position: absolute;
    user-select: none;
    overflow: visible;
    pointer-events: auto;
  }
`;

function DraggableList(props: any) {
  const { itemHeight, ItemRenderer, items, onUpdate } = props;
  const shouldReRender = get(props, "shouldReRender", true);
  // order of items in the list
  const order = useRef<any>(items.map((_: any, index: any) => index));

  const onDrop = (originalIndex: number, newIndex: number) => {
    onUpdate(order.current, originalIndex, newIndex);

    if (shouldReRender) {
      order.current = items.map((_: any, index: any) => index);
      setSprings(updateSpringStyles(order.current, itemHeight));
    }
  };

  useEffect(() => {
    // when items are updated(added/removed/updated) reassign order and animate springs.
    if (items.length !== order.current.length || shouldReRender === false) {
      order.current = items.map((_: any, index: any) => index);
      setSprings(updateSpringStyles(order.current, itemHeight));
    }
  }, [items]);

  const [springs, setSprings] = useSprings<any>(
    items.length,
    updateSpringStyles(order.current, itemHeight),
  );

  const bind: any = useDrag<any>((props: any) => {
    const originalIndex = props.args[0];
    const curIndex = order.current.indexOf(originalIndex);
    const curRow = clamp(
      Math.round((curIndex * itemHeight + props.movement[1]) / itemHeight),
      0,
      items.length - 1,
    );
    const newOrder = swap(order.current, curIndex, curRow);
    setSprings(
      dragIdleSpringStyles(newOrder, {
        down: props.down,
        originalIndex,
        curIndex,
        y: props.movement[1],
        itemHeight,
      }),
    );
    if (curRow !== curIndex) {
      // Feed springs new style data, they'll animate the view without causing a single render
      if (!props.down) {
        order.current = newOrder;
        setSprings(updateSpringStyles(order.current, itemHeight));
        debounce(onDrop, 400)(curIndex, curRow);
      }
    }
  });
  return (
    <DraggableListWrapper
      className="content"
      onMouseDown={() => {
        // set events to null to stop other parent draggable elements execution(ex: Property pane)
        document.onmouseup = null;
        document.onmousemove = null;
      }}
      style={{ height: items.length * itemHeight }}
    >
      {springs.map(({ scale, y, zIndex }, i) => (
        <animated.div
          {...bind(i)}
          data-rbd-draggable-id={items[i].id}
          key={i}
          style={{
            zIndex,
            width: "100%",
            transform: interpolate(
              [y, scale],
              (y, s) => `translate3d(0,${y}px,0) scale(${s})`,
            ),
          }}
        >
          <div>
            <ItemRenderer index={i} item={items[i]} />
          </div>
        </animated.div>
      ))}
    </DraggableListWrapper>
  );
}
DraggableList.displayName = "DraggableList";

export default DraggableList;
