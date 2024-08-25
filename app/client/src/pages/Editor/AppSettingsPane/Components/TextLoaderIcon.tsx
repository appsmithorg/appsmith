import styled from "styled-components";
import React from "react";
import { Icon } from "@appsmith/ads";

const Wrapper = styled.div`
  position: absolute;
  right: 17px;
  top: 11px;
  z-index: 1;

  .rotate {
    animation: rotation 8s infinite linear;
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function TextLoaderIcon() {
  return (
    <Wrapper>
      <Icon className="rotate" name="loader" size="md" />
    </Wrapper>
  );
}

export default TextLoaderIcon;
