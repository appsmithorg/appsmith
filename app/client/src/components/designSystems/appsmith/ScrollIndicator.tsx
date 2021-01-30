import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, animated, interpolate } from "react-spring";

const ScrollTrack = styled.div<{
  isVisible: boolean;
}>`
  position: absolute;
  z-index: 100;
  top: 0;
  right: 2px;
  width: 4px;
  height: 100%;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  transition: opacity 0.15s ease-in;
`;

const ScrollThumb = styled(animated.div)`
  width: 4px;
  background-color: #ebeef0aa;
  border-radius: 3px;
  transform: translate3d(0, 0, 0);
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}
const ScrollIndicator = ({ containerRef }: Props) => {
  const [{ thumbPosition }, setThumbPosition] = useSpring(() => ({
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
    <ScrollTrack isVisible={isScrollVisible}>
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
