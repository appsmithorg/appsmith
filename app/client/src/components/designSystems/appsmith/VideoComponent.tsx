import { ControlIcons } from "icons/ControlIcons";
import styled, { AnyStyledComponent } from "styled-components";
import { Colors } from "constants/Colors";
import ReactPlayer from "react-player";
import React from "react";

const PlayIcon = styled(ControlIcons.PLAY_VIDEO as AnyStyledComponent)`
  position: relative;
  top: 10px;
  &:hover {
    svg {
      path {
        fill: ${Colors.POMEGRANATE};
      }
    }
  }
`;

export interface VideoComponentProps {
  url: string;
}

export default function VideoComponent(props: VideoComponentProps) {
  return (
    <>
      <ReactPlayer
        playing={true}
        controls={true}
        url={props.url}
        width="100%"
        height="100%"
      />
    </>
  );
}
