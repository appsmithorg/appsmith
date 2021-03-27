import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import { useSpring, interpolate } from "react-spring";
import { ScrollThumb, ScrollTrackCSS } from "constants/DefaultTheme";
import { connect } from "react-redux";
import { AppState } from "reducers";

const ScrollTrack = styled.div<{
  isVisible: boolean;
  bottom?: string;
  top?: string;
  left?: string;
  mode?: "DARK" | "LIGHT";
}>`
  ${ScrollTrackCSS};
  height: 4px;
  /*&:hover {
    height: 8px;
  }*/
  ${(props) => (props.bottom ? "bottom:" + props.bottom : "")};
  ${(props) => (props.top ? "top:" + props.top : "")};
  left: ${(props) => (props.left ? props.left : "0")};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  box-shadow: inset 0 0 6px
    ${(props) =>
      props.mode
        ? props.mode === "LIGHT"
          ? props.theme.colors.scrollbarLightBG
          : props.theme.colors.scrollbarDarkBG
        : props.theme.colors.scrollbarLightBG};
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  bottom?: string;
  top?: string;
  left?: string;
  alwaysShowScrollbar?: boolean;
  mode?: "DARK" | "LIGHT";
  isResizing: boolean;
}
const HorizontalScrollIndicator = ({
  containerRef,
  bottom,
  top,
  left,
  alwaysShowScrollbar,
  isResizing,
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
    if (thumbRef.current) {
      // thumbRef.current.setAttribute("draggable", "true");
      thumbRef.current.addEventListener("ondrag", (e: any) => {
        console.log("on drag");
        e.stopPropagation();
      });
    }
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
  useEffect(() => {
    if (isResizing) {
      console.log({ isResizing });
      setIsScrollVisible(false);
      setTimeout(() => {
        if (containerRef.current) {
          const { offsetWidth, scrollWidth, scrollLeft } = containerRef.current;
          const thumbWidth = offsetWidth * (offsetWidth / scrollWidth);
          const thumbPosition =
            (scrollLeft / (scrollWidth - offsetWidth)) *
            (offsetWidth - thumbWidth);
          if (thumbRef.current) {
            console.log({ thumbWidth });
            thumbRef.current.style.width = thumbWidth + "px";
          }
          setThumbPosition({
            thumbPosition,
          });
        }
      }, 1000);
    }
  }, [isResizing]);
  return (
    <ScrollTrack
      isVisible={isScrollVisible && !isResizing}
      bottom={bottom}
      top={top}
      left={left}
    >
      <ScrollThumb
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

const mapStateToProps = (state: AppState): { isResizing: boolean } => ({
  isResizing: state.ui.widgetDragResize.isResizing,
});

export default connect(mapStateToProps)(HorizontalScrollIndicator);
