import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, animated, interpolate } from "react-spring";

const ScrollTrack = styled.div<{
  isVisible: boolean;
  bottom?: string;
  left?: string;
  mode?: "DARK" | "LIGHT";
}>`
  position: absolute;
  z-index: 100;
  bottom: ${(props) => (props.bottom ? props.bottom : "0px")};
  left: ${(props) => (props.left ? props.left : "0")};
  height: 4px;
  box-shadow: inset 0 0 6px
    ${(props) =>
      props.mode
        ? props.mode === "LIGHT"
          ? props.theme.colors.scrollbarLightBG
          : props.theme.colors.scrollbarDarkBG
        : props.theme.colors.scrollbarBG};
  overflow: hidden;
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  transition: opacity 0.15s ease-in;
`;

const ScrollThumb = styled(animated.div)<{ mode?: "DARK" | "LIGHT" }>`
  height: 4px;
  background-color: ${(props) =>
    props.mode
      ? props.mode === "LIGHT"
        ? props.theme.colors.scrollbarLight
        : props.theme.colors.scrollbarDark
      : props.theme.colors.scrollbar};
  border-radius: ${(props) => props.theme.radii[3]}px;
  transform: translate3d(0, 0, 0);
  position: fixed;
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  bottom?: string;
  left?: string;
  alwaysShowScrollbar?: boolean;
  mode?: "DARK" | "LIGHT";
}
const HorizontalScrollIndicator = ({
  containerRef,
  bottom,
  left,
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

  const handleContainerScroll = (e: any): void => {
    setIsScrollVisible(true);
    const { offsetWidth, scrollWidth, scrollLeft } = e.target;
    const thumbWidth = offsetWidth * (offsetWidth / scrollWidth);
    const thumbPosition =
      (scrollLeft / (scrollWidth - offsetWidth)) * (offsetWidth - thumbWidth);
    if (thumbRef.current) {
      thumbRef.current.style.width = thumbWidth + "px";
    }
    setThumbPosition({
      thumbPosition,
    });
  };

  useEffect(() => {
    containerRef.current?.addEventListener("scroll", handleContainerScroll);
    return () => {
      containerRef.current?.removeEventListener(
        "scroll",
        handleContainerScroll,
      );
    };
  }, []);

  useEffect(() => {
    if (isScrollVisible) {
      hideScrollbar();
    }
  }, [isScrollVisible]);

  const hideScrollbar = _.debounce(() => {
    setIsScrollVisible(alwaysShowScrollbar || false);
  }, 1500);

  return (
    <ScrollTrack isVisible={isScrollVisible} bottom={bottom} left={left}>
      <ScrollThumb
        className="scrollbar-thumb"
        ref={thumbRef}
        style={{
          marginLeft: interpolate(
            [thumbPosition],
            (left: number) => `${left}px`,
          ),
        }}
      />
    </ScrollTrack>
  );
};

export default HorizontalScrollIndicator;
