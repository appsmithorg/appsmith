import React, { useEffect } from "react";
import {
  useFloating,
  shift,
  flip,
  offset,
  autoUpdate,
} from "@floating-ui/react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getFloatingPaneRefElement } from "./selectors";
import { animated, useSpring } from "react-spring";

interface Props {
  children: React.ReactNode;
}

const StyledFloatingContainer = styled(animated.div)`
  z-index: 1000;
  padding: var(--ads-v2-spaces-4);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  min-width: 17rem;
  min-height: 12rem;
  box-shadow: var(--ads-v2-shadow-popovers);
  transform-origin: top left;
`;

const Wrapper = (props: Props) => {
  const { floatingStyles, refs } = useFloating({
    middleware: [
      shift(),
      flip(),
      offset({
        mainAxis: 10,
      }),
    ],
    whileElementsMounted: autoUpdate,
    transform: false,
    placement: "bottom-start",
  });

  const refElement = useSelector(getFloatingPaneRefElement);

  useEffect(() => {
    if (refElement) {
      refs.setReference(refElement);
    }
  }, [refElement]);

  const animationStyles = useSpring({
    from: { opacity: 0, transform: "scaleY(0)" },
    to: { opacity: 1, transform: "scaleY(1)" },
    config: { tension: 250, friction: 20 },
  });

  return (
    <StyledFloatingContainer
      ref={refs.setFloating}
      style={{ ...floatingStyles, ...animationStyles }}
    >
      {props.children}
    </StyledFloatingContainer>
  );
};
export default Wrapper;
