import React from "react";
import styled from "styled-components";

interface DisablerProps {
  isDisabled: boolean;
  children?: React.ReactNode;
}

const DisabledContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  cursor: not-allowed;

  & * {
    pointer-events: none;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.4);
  z-index: 1000;
`;

function Disabler({ children, isDisabled }: DisablerProps) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!isDisabled) return <>{children}</>;

  return (
    <DisabledContainer>
      <Overlay />
      {children}
    </DisabledContainer>
  );
}

export default Disabler;
