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
    const displacement = curIndex * itemHeight + y;
    return {
      y: displacement,
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
  scroll-behavior: smooth;
  transition: 0.1s transform;
  & > div {
    position: absolute;
    user-select: none;
    overflow: visible;
    pointer-events: auto;
  }
`;

function DraggableList(props: any) {
  const { fixedHeight, itemHeight, ItemRenderer, items, onUpdate } = props;
  const listContainerHeight =
    fixedHeight && fixedHeight < items.length * itemHeight
      ? fixedHeight
      : items.length * itemHeight;
  const shouldReRender = get(props, "shouldReRender", true);
  // order of items in the list
  const order = useRef<any>(items.map((_: any, index: any) => index));
  const displacement = useRef<number>(0);

  const listRef = useRef<HTMLDivElement | null>(null);

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
    const pointerFromTop = props.xy[1];
    if (listRef && listRef.current) {
      const containerCoordinates = listRef?.current.getBoundingClientRect();
      const container = listRef.current;
      if (containerCoordinates) {
        const containerDistanceFromTop = containerCoordinates.top;
        if (props.dragging) {
          if (pointerFromTop < containerDistanceFromTop + itemHeight / 2) {
            // Scroll inside container till first element in list is completely visible
            if (container.scrollTop > 0) {
              container.scrollTop -= itemHeight / 10;
            }
          } else if (
            pointerFromTop >=
            containerDistanceFromTop + container.clientHeight - itemHeight / 2
          ) {
            // Scroll inside container till container cannnot be scrolled more towards bottom
            if (
              container.scrollTop <
              container.scrollHeight - container.clientHeight
            ) {
              container.scrollTop += itemHeight / 10;
            }
          }
          // finding distance of current pointer from the top of the container to find the final position
          // currIndex *  itemHeight for the initial position
          // subtraction formar with latter for displacement
          displacement.current =
            pointerFromTop -
            containerDistanceFromTop +
            container.scrollTop -
            curIndex * itemHeight;
        }

        const curRow = clamp(
          Math.round(
            (curIndex * itemHeight + displacement.current) / itemHeight,
          ),
          0,
          items.length - 1,
        );
        const newOrder = swap(order.current, curIndex, curRow);
        setSprings(
          dragIdleSpringStyles(newOrder, {
            down: props.down,
            originalIndex,
            curIndex,
            y: displacement.current,
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
      }
    }
  });

  return (
    <div
      ref={listRef}
      style={{
        height: listContainerHeight,
        overflowY: "auto",
        zIndex: 1,
      }}
    >
      <DraggableListWrapper
        className="content"
        onMouseDown={() => {
          // set events to null to stop other parent draggable elements execution(ex: Property pane)
          document.onmouseup = null;
          document.onmousemove = null;
        }}
        style={{
          height: "100%",
        }}
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
    </div>
  );
}
DraggableList.displayName = "DraggableList";

export default DraggableList;
