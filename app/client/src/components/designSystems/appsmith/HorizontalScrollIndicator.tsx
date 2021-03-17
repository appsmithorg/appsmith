import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, animated, interpolate } from "react-spring";

const ScrollTrack = styled.div<{
  isVisible: boolean;
}>`
  position: absolute;
  z-index: 100;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 100%;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  transition: opacity 0.15s ease-in;
`;

const ScrollThumb = styled(animated.div)`
  height: 4px;
  background-color: #666666;
  border-radius: 3px;
  transform: translate3d(0, 0, 0);
  position: relative;
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}
const HorizontalScrollIndicator = ({ containerRef }: Props) => {
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
      const thumbFromLeft =
        e.target.offsetWidth / (e.target.scrollWidth / e.target.offsetWidth);
      const thumbPosition = e.target.scrollLeft;
      /* set scroll thumb height */
      if (thumbRef.current) {
        thumbRef.current.style.width = thumbFromLeft + "px";
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
    <ScrollTrack isVisible={isScrollVisible} className="scrollbar-track">
      <ScrollThumb
        className="scrollbar-thumb"
        ref={thumbRef}
        style={{
          left: interpolate([thumbPosition], (left: number) => `${left}px`),
        }}
      />
    </ScrollTrack>
  );
};

export default HorizontalScrollIndicator;
