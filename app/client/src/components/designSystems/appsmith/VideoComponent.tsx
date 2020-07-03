import React from "react";
import ReactPlayer from "react-player";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { ControlIcons } from "icons/ControlIcons";
import styled, { AnyStyledComponent } from "styled-components";
import { Colors } from "constants/Colors";

const PlayerWrapper = styled.div`
  width: 600px;
  height: 400px;
`;

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

interface VideoComponentProps {
  url: string;
}

const VideoComponent = (props: VideoComponentProps) => {
  return (
    <div onClick={e => e.stopPropagation()}>
      <Popover
        position={PopoverPosition.AUTO}
        interactionKind={PopoverInteractionKind.CLICK}
        minimal
        usePortal
        enforceFocus={false}
        lazy={true}
        modifiers={{
          flip: {
            behavior: ["right", "left", "bottom", "top"],
          },
          keepTogether: {
            enabled: false,
          },
          arrow: {
            enabled: false,
          },
          preventOverflow: {
            enabled: true,
            boundariesElement: "viewport",
          },
        }}
      >
        <PlayIcon width="80" height="52" color="black" />
        <PlayerWrapper>
          <ReactPlayer
            playing={true}
            url={props.url}
            width="100%"
            height="100%"
          />
        </PlayerWrapper>
      </Popover>
    </div>
  );
};

export default VideoComponent;
