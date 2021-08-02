import React, { useEffect, useRef } from "react";
import { clamp } from "lodash-es";
import swap from "lodash-move";
import { useDrag, useGesture } from "react-use-gesture";
import { useSprings, animated, interpolate } from "react-spring";
import styled from "styled-components";
import { debounce } from "lodash";

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

function DraggableList({ itemHeight, ItemRenderer, items, onUpdate }: any) {
  // order of items in the list
  const order = useRef<any>(items.map((_: any, index: any) => index));
  const listWrapper = useRef<HTMLDivElement | null>(null);
  const selectedItem = useRef<number>(-1);
  const scrollTop = useRef<number>(0);

  const onDrop = () => {
    onUpdate(order.current);
    order.current = items.map((_: any, index: any) => index);
    setSprings(updateSpringStyles(order.current, itemHeight));
    selectedItem.current = -1;
  };

  useEffect(() => {
    // when items are updated(added/removed/updated) reassign order and animate springs.
    if (items.length !== order.current.length) {
      order.current = items.map((_: any, index: any) => index);
      setSprings(updateSpringStyles(order.current, itemHeight));
    }
  }, [items]);

  let isScrolling: any = null;
  const handleScroll = () => {
    window.clearTimeout(isScrolling);

    isScrolling = setTimeout(() => {
      const scrollWrapper = listWrapper.current?.closest(
        ".t--property-pane-content-section",
      );
      const offset = (scrollWrapper?.scrollTop || 0) - scrollTop.current;
      // console.log(offset);
      if (selectedItem.current > -1) {
        const curRow = clamp(
          Math.round((selectedItem.current * itemHeight + offset) / itemHeight),
          0,
          items.length - 1,
        );
        const newOrder = [...order.current];
        // The dragged column
        const movedColumnName = newOrder.splice(selectedItem.current, 1);
        // If the dragged column exists
        if (movedColumnName && movedColumnName.length === 1) {
          newOrder.splice(curRow, 0, movedColumnName[0]);
        }
        order.current = newOrder;
        selectedItem.current = newOrder.indexOf(selectedItem.current);
        setSprings(updateSpringStyles(order.current, itemHeight));
      }
      scrollTop.current = scrollWrapper?.scrollTop || 0;
    }, 166);
  };

  useEffect(() => {
    const scrollWrapper = listWrapper.current?.closest(
      ".t--property-pane-content-section",
    );
    if (scrollWrapper) {
      scrollWrapper.addEventListener("scroll", handleScroll);
      return () => {
        scrollWrapper.removeEventListener("scroll", handleScroll);
      };
    }
  }, [listWrapper]);

  const [springs, setSprings] = useSprings<any>(
    items.length,
    updateSpringStyles(order.current, itemHeight),
  );

  const bind: any = useGesture(
    {
      onDrag: (props: any) => {
        const originalIndex = props.args[0];
        const curIndex = order.current.indexOf(originalIndex);
        selectedItem.current = curIndex;
        const curRow = clamp(
          Math.round((curIndex * itemHeight + props.movement[1]) / itemHeight),
          0,
          items.length - 1,
        );
        const newOrder = swap(order.current, curIndex, curRow);
        const scrollWrapper = listWrapper.current?.closest(
          ".t--property-pane-content-section",
        );
        const sRect = scrollWrapper?.getBoundingClientRect();
        const dRect = listWrapper.current?.getBoundingClientRect();
        const sPos: any = {
          top: sRect?.top || 0,
          bottom: sRect?.bottom || 0,
        };
        const dPos = {
          top: dRect?.top || 0,
          bottom: dRect?.bottom || 0,
        };
        // scrolled down
        if (
          props.movement[1] > 0 &&
          props.xy[1] > sPos.bottom - itemHeight * 1.5
        ) {
          if (dPos.bottom > sPos.bottom && curRow < items.length - 1) {
            scrollWrapper?.scrollTo({
              top: scrollTop.current + itemHeight * 2,
              behavior: "smooth",
            });
          }
        }
        // scrolled up
        else if (
          props.xy[1] < sPos.top + itemHeight * 1.5 &&
          dPos.top < sPos.top &&
          curRow > 0
        ) {
          scrollWrapper?.scrollTo({
            top: scrollTop.current - itemHeight * 2,
            behavior: "smooth",
          });
        }

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
            debounce(onDrop, 400)();
          }
        }
      },
    },
    {},
  );

  return (
    <DraggableListWrapper
      className="content"
      onMouseDown={() => {
        // set events to null to stop other parent draggable elements execution(ex: Property pane)
        document.onmouseup = null;
        document.onmousemove = null;
      }}
      ref={listWrapper}
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
