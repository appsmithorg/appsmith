import React from "react";
import styled from "styled-components";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

const StyledImageBanner = styled.div`
  width: 50%;
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
  /* Animations */
  @keyframes falling-confetti {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 972px;
    }
  }
`;

const LayerImage = styled.div`
  width: 100%; /* Adjust the image width as needed */
  height: 100%;
  position: absolute; /* Position the image absolutely within the container */
  top: 0;
  left: 0;
  background-size: auto 972px;
  background-repeat: repeat;
  &#layer1 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-1.png`)});
    animation: falling-confetti 7s linear infinite;
  }
  &#layer2 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-2.png`)});
    animation: falling-confetti 10s linear infinite;
  }
  &#layer3 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-3.png`)});
    animation: falling-confetti 15s linear infinite;
  }
`;

const ElementImage = styled.img`
  position: absolute;
  width: 300px;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
`;

const WelcomeBackground = () => (
  <StyledImageBanner>
    <LayerImage id="layer3" />
    <LayerImage id="layer2" />
    <ElementImage src={getAssetUrl(`${ASSETS_CDN_URL}/profiling.png`)} />
    <LayerImage id="layer1" />
  </StyledImageBanner>
);

export default WelcomeBackground;
