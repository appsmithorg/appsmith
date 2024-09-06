import React, { useState } from "react";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";
import Text, { TextType } from "../Text";
import { Classes } from "../constants/classes";

interface GifPlayerProps {
  gif: string;
  thumbnail: string;
}

const PlayButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  .${Classes.ICON} {
    svg {
      width: 34px;
      height: 34px;
      margin-right: 0px;
      path {
        fill: var(--ads-v2-color-bg);
        opacity: 1;
      }
      circle {
        fill: var(--ads-v2-color-fg);
        opacity: 1;
      }
    }
  }
  .${Classes.TEXT} {
    margin-top: var(--ads-spaces-3);
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: var(--ads-gif-player-overlay-background-color);
  opacity: 0.7;
  width: 100%;
  height: 100%;
  transition: 0.5s ease;
`;

function GifPlayer(props: GifPlayerProps) {
  const [startGif, setStartGif] = useState(false);
  return !startGif ? (
    <ThumbnailContainer onClick={() => setStartGif(!startGif)}>
      <Overlay />
      <img src={props.thumbnail} />
      <PlayButton>
        <Icon name="play" size="lg" />
        <Text color={"var(--ads-v2-color-fg)"} type={TextType.P3}>
          Click to play
        </Text>
      </PlayButton>
    </ThumbnailContainer>
  ) : (
    <img src={props.gif} />
  );
}

export default GifPlayer;
