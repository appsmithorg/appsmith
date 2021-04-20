import React, { useState } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import Text, { TextType } from "./Text";
import { Classes } from "./common";

type GifPlayerProps = {
  gif: string;
  thumbnail: string;
};

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
        fill: ${(props) => props.theme.colors.gif.iconPath};
      }
      circle {
        fill: ${(props) => props.theme.colors.gif.iconCircle};
      }
    }
  }
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.gif.text};
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ThumnailContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: ${(props) => props.theme.colors.gif.overlay};
  opacity: 0.7;
  width: 100%;
  height: 100%;
  transition: 0.5s ease;
`;

function GifPlayerComponent(props: GifPlayerProps) {
  const [startGif, setStartGif] = useState(false);
  return !startGif ? (
    <ThumnailContainer onClick={() => setStartGif(!startGif)}>
      <Overlay />
      <img src={props.thumbnail} />
      <PlayButton>
        <Icon name="play" size={IconSize.XXXL} />
        <Text type={TextType.P3}>Click to play</Text>
      </PlayButton>
    </ThumnailContainer>
  ) : (
    <img src={props.gif} />
  );
}

export default GifPlayerComponent;
