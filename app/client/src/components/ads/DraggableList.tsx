import React, { useEffect, useRef } from "react";
import { clamp } from "lodash-es";
import swap from "lodash-move";
import { useDrag } from "react-use-gesture";
import { useSprings, animated, interpolate } from "react-spring";
import styled from "styled-components";
import { debounce } from "lodash";
// Returns fitting styles for dragged/idle items
const fn: any = (order: any, { down, originalIndex, curIndex, y }: any) => (
  index: any,
) => {
  return down && index === originalIndex
    ? {
        y: curIndex * 45 + y,
        scale: 1,
        zIndex: "1",
        shadow: 15,
        immediate: true,
      }
    : {
        y: order.indexOf(index) * 45,
        scale: 1,
        zIndex: "0",
        shadow: 1,
        immediate: false,
      };
};

const staticfn: any = (order: any) => (index: any) => {
  return {
    y: order.indexOf(index) * 45,
    scale: 1,
    zIndex: "0",
    shadow: 1,
    immediate: true,
  };
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

const DraggableList = ({ items, ItemRenderer, onUpdate }: any) => {
  const order = useRef<any>(items.map((_: any, index: any) => index)); // Store indicies as a local ref, this represents the item order
  const onRest = () => {
    const newOrderedItems = order.current.map((each: any) => items[each]);
    order.current = items.map((_: any, index: any) => index);
    onUpdate(newOrderedItems);
    setSprings(staticfn(order.current, { down: false }));
  };
  useEffect(() => {
    order.current = items.map((_: any, index: any) => index);
    setSprings(staticfn(order.current, { down: false }));
  }, [items]);
  const [springs, setSprings] = useSprings<any>(
    items.length,
    fn(order.current, { down: false }),
  ); // Create springs, each corresponds to an item, controlling its transform, scale, etc.

  const bind: any = useDrag<any>((props: any) => {
    const originalIndex = props.args[0];
    const curIndex = order.current.indexOf(originalIndex);
    const curRow = clamp(
      Math.round((curIndex * 45 + props.movement[1]) / 45),
      0,
      items.length - 1,
    );
    const newOrder = swap(order.current, curIndex, curRow);
    setSprings(
      fn(newOrder, {
        down: props.down,
        originalIndex,
        curIndex,
        y: props.movement[1],
        curRow,
      }),
    );
    if (curRow !== curIndex) {
      // Feed springs new style data, they'll animate the view without causing a single render
      if (!props.down) {
        order.current = newOrder;
        setSprings(
          fn(order.current, {
            down: false,
            curRow,
          }),
        );
        debounce(onRest, 400)();
      }
    }
  });
  return (
    <DraggableListWrapper
      onMouseDown={() => {
        // set events to null to stop other parent draggable elements execution(ex: Property pane)
        document.onmouseup = null;
        document.onmousemove = null;
      }}
      className="content"
      style={{ height: items.length * 45 }}
    >
      {springs.map(({ zIndex, y, scale }, i) => (
        <animated.div
          {...bind(i)}
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
            <ItemRenderer item={items[i]} index={i} />
          </div>
        </animated.div>
      ))}
    </DraggableListWrapper>
  );
};
DraggableList.displayName = "DraggableList";

export default DraggableList;
