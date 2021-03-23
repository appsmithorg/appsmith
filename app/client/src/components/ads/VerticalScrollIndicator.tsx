import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, interpolate } from "react-spring";
import { ScrollThumb, ScrollTrackCSS } from "constants/DefaultTheme";

const ScrollTrack = styled.div<{
  isVisible: boolean;
  top?: string;
  bottom?: string;
  right?: string;
  mode?: "DARK" | "LIGHT";
}>`
  ${ScrollTrackCSS};
  top: ${(props) => (props.top ? props.top : "0px")};
  bottom: ${(props) => (props.bottom ? props.bottom : "0px")};
  right: ${(props) => (props.right ? props.right : "2px")};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  box-shadow: inset 0 0 6px
    ${(props) =>
      props.mode
        ? props.mode === "LIGHT"
          ? props.theme.colors.scrollbarLightBG
          : props.theme.colors.scrollbarDarkBG
        : props.theme.colors.scrollbarBG};
  width: 4px;
`;

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  top?: string;
  bottom?: string;
  right?: string;
  alwaysShowScrollbar?: boolean;
  mode?: "DARK" | "LIGHT";
}
const VerticalScrollIndicator = ({
  containerRef,
  top,
  bottom,
  right,
  alwaysShowScrollbar,
}: Props) => {
  const [{ thumbPosition }, setThumbPosition] = useSpring<{
    thumbPosition: number;
    config: {
      clamp: boolean;
      friction: number;
      precision: number;
      tension: number;
    };
  }>(() => ({
    thumbPosition: 0,
    config: {
      clamp: true,
      friction: 10,
      precision: 0.1,
      tension: 800,
    },
  }));
  const [isScrollVisible, setIsScrollVisible] = useState(
    alwaysShowScrollbar || false,
  );
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContainerScroll = (e: any): void => {
      setIsScrollVisible(true);
      const thumbHeight =
        e.target.offsetHeight / (e.target.scrollHeight / e.target.offsetHeight);
      const thumbPosition = (e.target.scrollTop / e.target.offsetHeight) * 100;
      /* set scroll thumb height */
      if (thumbRef.current) {
        thumbRef.current.style.height = thumbHeight + "px";
      }
      setThumbPosition({
        thumbPosition,
      });
    };

    // const handlehorizontalScroll = (e: any): void => {
    //   const trackPosition = e.target.scrollLeft;
    //   if (trackRef.current) {
    //     trackRef.current.style.right = `${-trackPosition + 2}px`;
    //   }
    // };

    containerRef.current?.addEventListener("scroll", handleContainerScroll);

    // if (horizontalScrollContainerRef) {
    //   horizontalScrollContainerRef.current?.addEventListener(
    //     "scroll",
    //     handlehorizontalScroll,
    //   );
    // }

    return () => {
      containerRef.current?.removeEventListener(
        "scroll",
        handleContainerScroll,
      );
      // if (horizontalScrollContainerRef) {
      //   horizontalScrollContainerRef.current?.removeEventListener(
      //     "scroll",
      //     handlehorizontalScroll,
      //   );
      // }
    };
  }, []);

  useEffect(() => {
    if (isScrollVisible) {
      hideScrollbar();
    }
  }, [isScrollVisible]);

  const hideScrollbar = _.debounce(() => {
    setIsScrollVisible(true);
  }, 1500);

  return (
    <ScrollTrack
      isVisible={isScrollVisible}
      top={top}
      bottom={bottom}
      right={right}
      ref={trackRef}
    >
      <ScrollThumb
        isVertical
        ref={thumbRef}
        style={{
          transform: interpolate(
            [thumbPosition],
            (top: number) => `translate3d(0px, ${top}%, 0)`,
          ),
        }}
      />
    </ScrollTrack>
  );
};

export default VerticalScrollIndicator;
