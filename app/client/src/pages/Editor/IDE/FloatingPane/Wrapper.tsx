import React from "react";
import { useFloating, shift, flip, offset } from "@floating-ui/react";
import styled from "styled-components";

interface Props {
  children: React.ReactNode;
}

const StyledFloatingContainer = styled.div`
  z-index: 99999;
  padding: 8px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  min-width: 12rem;
  min-height: 12rem;
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
  });

  return (
    <StyledFloatingContainer ref={refs.setFloating} style={floatingStyles}>
      {props.children}
    </StyledFloatingContainer>
  );
};
export default Wrapper;
