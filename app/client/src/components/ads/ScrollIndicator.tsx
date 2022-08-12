import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import _ from "lodash";
import { animated, useSpring, to } from "react-spring";

export const ScrollThumb = styled(animated.div)<{
  mode?: "DARK" | "LIGHT";
}>`
  position: relative;
  width: 4px;
  transform: translate3d(0, 0, 0);
  background-color: ${(props) =>
    props.mode
      ? props.mode === "LIGHT"
        ? props.theme.colors.scrollbarLight
        : props.theme.colors.scrollbarDark
      : props.theme.colors.scrollbarLight};
  border-radius: ${(props) => props.theme.radii[3]}px;
`;

const ScrollTrack = styled.div<{
  isVisible: boolean;
  top?: string;
  bottom?: string;
  right?: string;
  mode?: "DARK" | "LIGHT";
}>`
  position: absolute;
  z-index: 100;
  overflow: hidden;
  transition: opacity 0.15s ease-in;
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
        : props.theme.colors.scrollbarLightBG};
  width: 4px;
`;

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  top?: string;
  bottom?: string;
  right?: string;
  alwaysShowScrollbar?: boolean;
  showScrollbarOnlyOnHover?: boolean;
  mode?: "DARK" | "LIGHT";
}
function ScrollIndicator({
  alwaysShowScrollbar,
  bottom,
  containerRef,
  right,
  showScrollbarOnlyOnHover = false,
  top,
}: Props) {
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
    /*
      showScrollbarOnlyOnHover prop if true will bypass hideScrollbar functionality
      as hideScrollbar behaviour conflicts with showScrollbarOnlyOnHover functionality
    */
    if (isScrollVisible && !showScrollbarOnlyOnHover) {
      hideScrollbar();
    }
  }, [isScrollVisible]);

  const hideScrollbar = _.debounce(() => {
    setIsScrollVisible(alwaysShowScrollbar || false);
  }, 1500);

  const setScrollVisibilityOnHover = useCallback((e) => {
    if (e?.type === "mouseenter") {
      setIsScrollVisible(true);
    } else if (e?.type === "mouseleave") {
      setIsScrollVisible(false);
    }
  }, []);

  useEffect(() => {
    /* This useEffect adds events to show/hide scrollbar when showScrollbarOnlyOnHover prop is true */
    if (showScrollbarOnlyOnHover) {
      containerRef.current?.addEventListener(
        "mouseenter",
        setScrollVisibilityOnHover,
      );
      containerRef.current?.addEventListener(
        "mouseleave",
        setScrollVisibilityOnHover,
      );
    }
    return () => {
      if (showScrollbarOnlyOnHover) {
        containerRef.current?.removeEventListener(
          "mouseenter",
          setScrollVisibilityOnHover,
        );
        containerRef.current?.removeEventListener(
          "mouseleave",
          setScrollVisibilityOnHover,
        );
      }
    };
  }, [containerRef, showScrollbarOnlyOnHover]);

  return (
    <ScrollTrack
      bottom={bottom}
      isVisible={isScrollVisible}
      right={right}
      top={top}
    >
      <ScrollThumb
        ref={thumbRef}
        style={{
          transform: to(
            [thumbPosition],
            (top: number) => `translate3d(0px, ${top}%, 0)`,
          ),
        }}
      />
    </ScrollTrack>
  );
}

export default ScrollIndicator;
