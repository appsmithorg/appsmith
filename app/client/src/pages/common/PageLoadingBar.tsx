import React from "react";
import styled from "styled-components";

const StyledLoader = styled.div`
  @-webkit-keyframes animation-circle-loader {
    0% {
      stroke-dasharray: 1px, 200px;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 100px, 200px;
      stroke-dashoffset: -15px;
    }
    100% {
      stroke-dasharray: 100px, 200px;
      stroke-dashoffset: -125px;
    }
  }

  @keyframes animation-circle-loader {
    0% {
      stroke-dasharray: 1px, 200px;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 100px, 200px;
      stroke-dashoffset: -15px;
    }
    100% {
      stroke-dasharray: 100px, 200px;
      stroke-dashoffset: -125px;
    }
  }
  @-webkit-keyframes animation-svg-loader {
    0% {
      -webkit-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -ms-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -ms-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes animation-svg-loader {
    0% {
      -webkit-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -ms-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -ms-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  #loader {
    position: fixed;
    left: 50%;
    top: 50%;
    width: 40px;
    height: 40px;
    transform: translate(-50%, -50%);
    color: #1976d2;
    animation: animation-svg-loader 1.4s linear infinite;
    -webkit-animation: animation-svg-loader 1.4s linear infinite;
  }
  #loader-circle {
    stroke: currentColor;
    stroke-dasharray: 80px, 200px;
    stroke-dashoffset: 0;
    animation: animation-circle-loader 1.4s ease-in-out infinite;
    -webkit-animation: animation-circle-loader 1.4s ease-in-out infinite;
  }
`;

function PageLoadingBar() {
  return (
    <StyledLoader>
      <svg id="loader" viewBox="22 22 44 44">
        <circle
          cx="44"
          cy="44"
          fill="none"
          id="loader-circle"
          r="20.2"
          strokeWidth="3.6"
        />
      </svg>
    </StyledLoader>
  );
}

export default PageLoadingBar;
