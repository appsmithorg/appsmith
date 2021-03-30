import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, animated, interpolate } from "react-spring";

const ScrollTrack = styled.div<{
  isVisible: boolean;
  top?: string;
  bottom?: string;
  right?: string;
  mode?: "DARK" | "LIGHT";
}>`
  position: absolute;
  z-index: 100;
  top: ${(props) => (props.top ? props.top : "0px")};
  bottom: ${(props) => (props.bottom ? props.bottom : "0px")};
  right: ${(props) => (props.right ? props.right : "2px")};
  width: 4px;
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
  width: 4px;
  background-color: ${(props) =>
    props.mode
      ? props.mode === "LIGHT"
        ? props.theme.colors.scrollbarLight
        : props.theme.colors.scrollbarDark
      : props.theme.colors.scrollbar};
  border-radius: ${(props) => props.theme.radii[3]}px;
  transform: translate3d(0, 0, 0);
`;

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  top?: string;
  bottom?: string;
  right?: string;
  mode?: "DARK" | "LIGHT";
}
const ScrollIndicator = ({ containerRef, top, bottom, right }: Props) => {
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
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

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
    setIsScrollVisible(false);
  }, 1500);

  return (
    <ScrollTrack
      isVisible={isScrollVisible}
      top={top}
      bottom={bottom}
      right={right}
    >
      <ScrollThumb
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

export default ScrollIndicator;
