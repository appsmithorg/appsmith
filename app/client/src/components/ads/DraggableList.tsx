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
  const shouldReRender = get(props, "shouldReRender", true);
  // order of items in the list
  const order = useRef<any>(items.map((_: any, index: any) => index));

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
    let displacement = props.movement[1];
    const pointerFromTop = props.xy[1];
    if (listRef && listRef.current) {
      const containerCoordinates = listRef?.current.getBoundingClientRect();
      const container = listRef.current;
      if (containerCoordinates) {
        const containerDistanceFromTop = containerCoordinates.top;
        if (props.dragging) {
          // eslint-disable-next-line no-console
          // console.log({
          //   displacement: displacement,
          //   pointerFromTop: pointerFromTop,
          //   containerScrollTop: container.scrollTop,
          //   containerScrollHeight: container.scrollHeight,
          //   containerClientHeight: container.clientHeight,
          // });
          if (pointerFromTop < containerDistanceFromTop + itemHeight / 2) {
            //Scroll inside container till first element in list is completely visible
            if (container.scrollTop > 0) {
              container.scrollTop -= itemHeight / 10;
            }
            displacement = container.scrollTop - curIndex * itemHeight;
            // eslint-disable-next-line no-console
            console.log({
              message: "above container",
            });
          } else if (
            pointerFromTop >=
            containerDistanceFromTop + container.clientHeight - itemHeight / 2
          ) {
            //Scroll inside container till container cannnot be scrolled more towards bottom
            if (
              container.scrollTop <
              container.scrollHeight - container.clientHeight
            ) {
              container.scrollTop += itemHeight / 10;
            }
            displacement += container.scrollTop;
            // eslint-disable-next-line no-console
            console.log({
              message: "below container",
            });
          } else if (
            pointerFromTop > containerDistanceFromTop &&
            pointerFromTop <
              containerDistanceFromTop + container.clientHeight &&
            container.scrollTop > 0 &&
            container.scrollTop <
              container.scrollHeight - container.clientHeight
          ) {
            // eslint-disable-next-line no-console
            console.log({
              message: "inside container",
              displacement: displacement,
              pointerFromTop: pointerFromTop,
              containerScrollTop: container.scrollTop,
              containerScrollHeight: container.scrollHeight,
              containerClientHeight: container.clientHeight,
            });
            if (displacement > 0) {
              displacement += container.scrollTop;
            } else {
              displacement = container.scrollTop - curIndex * itemHeight;
            }
          }
          // else if (
          //   container.scrollTop !==
          //   container.scrollHeight - container.clientHeight
          // ) {
          //   // container is scrolled but pointer is within list area
          //   if (props.movement[1] > 0) {
          //     displacement += container.scrollTop;
          //   } else {
          //     displacement = container.scrollTop - curIndex * itemHeight;
          //   }
          // }
        } else {
          /*calculated actual displacemenet of dragged element based on positive/negative 
          movement and container scroll position with respect to inital position of 
          dragged elemet */
          if (displacement > 0) {
            displacement += container.scrollTop;
          } else {
            displacement = container.scrollTop - curIndex * itemHeight;
          }
        }
      }
    }
    const curRow = clamp(
      Math.round((curIndex * itemHeight + displacement) / itemHeight),
      0,
      items.length - 1,
    );
    const newOrder = swap(order.current, curIndex, curRow);
    setSprings(
      dragIdleSpringStyles(newOrder, {
        down: props.down,
        originalIndex,
        curIndex,
        y: displacement,
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
    <div
      ref={listRef}
      style={{
        height: fixedHeight ? fixedHeight : items.length * itemHeight,
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
