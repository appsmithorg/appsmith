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

interface Props {
  children: React.ReactNode;
}

const StyledFloatingContainer = styled.div`
  z-index: 1000;
  padding: 8px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  min-width: 12rem;
  min-height: 12rem;
  box-shadow: var(--ads-v2-shadow-popovers);
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
  });

  const refElement = useSelector(getFloatingPaneRefElement);

  useEffect(() => {
    if (refElement) {
      refs.setReference(refElement);
    }
  }, [refElement]);

  return (
    <StyledFloatingContainer ref={refs.setFloating} style={floatingStyles}>
      {props.children}
    </StyledFloatingContainer>
  );
};
export default Wrapper;
