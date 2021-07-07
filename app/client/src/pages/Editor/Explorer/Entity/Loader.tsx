import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  & {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
  }
  & > div {
    position: absolute;
    top: 0;
    right: 100%;
    bottom: 0;
    left: 0;
    background: ${(props) => props.theme.colors.primaryOld};
    width: 0;
    animation: borealisBar 1s linear infinite;
  }

  @keyframes borealisBar {
    0% {
      left: 0%;
      right: 100%;
      width: 0%;
    }
    10% {
      left: 0%;
      right: 75%;
      width: 25%;
    }
    90% {
      right: 0%;
      left: 75%;
      width: 25%;
    }
    100% {
      left: 100%;
      right: 0%;
      width: 0%;
    }
  }
`;
export function EntityLoader(props: { isVisible: boolean }) {
  if (!props.isVisible) return null;
  return (
    <Wrapper>
      <div />
    </Wrapper>
  );
}

export default EntityLoader;
