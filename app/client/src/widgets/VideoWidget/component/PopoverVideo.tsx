import React from "react";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import VideoComponent, { VideoComponentProps } from "./";
import styled, { AnyStyledComponent } from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
const PlayIcon = styled(ControlIcons.PLAY_VIDEO as AnyStyledComponent)`
  position: relative;
  cursor: pointer;
  &:hover {
    svg {
      path {
        fill: ${Colors.POMEGRANATE};
      }
    }
  }
`;

const PlayerWrapper = styled.div`	import React, { Ref } from "react";
  width: 600px;
  height: 400px;
`;

function PopoverVideo(props: VideoComponentProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover
        enforceFocus={false}
        interactionKind={PopoverInteractionKind.CLICK}
        lazy
        minimal
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
        position={PopoverPosition.AUTO}
        usePortal
      >
        <PlayIcon className="play-icon" />
        <PlayerWrapper>
          <VideoComponent
            backgroundColor={props.backgroundColor}
            borderRadius={props.borderRadius}
            boxShadow={props.boxShadow}
            url={props.url}
          />
        </PlayerWrapper>
      </Popover>
    </div>
  );
}

export default PopoverVideo;
