import { ReactComponent as SpinnerSvg } from "assets/svg/loader-2-fill.svg";
import styled from "styled-components";
import React from "react";

const CheckmarkWrapper = styled.div<{ $height: string; $width: string }>`
  #loading-spinner {
    animation: loading-spinner 2s linear infinite;
  }

  @keyframes loading-spinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function SpinnerLoader(props: { height: string; width: string }) {
  return (
    <CheckmarkWrapper $height={props.height} $width={props.width}>
      <SpinnerSvg id="loading-spinner" />
    </CheckmarkWrapper>
  );
}

export default SpinnerLoader;
