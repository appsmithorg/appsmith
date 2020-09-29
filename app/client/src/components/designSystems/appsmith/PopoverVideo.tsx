import React from "react";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import VideoComponent, { VideoComponentProps } from "./VideoComponent";
import styled, { AnyStyledComponent } from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
const PlayIcon = styled(ControlIcons.PLAY_VIDEO as AnyStyledComponent)`
  position: relative;
  top: 10px;
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

const PopoverVideo = (props: VideoComponentProps) => {
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
        <PlayIcon></PlayIcon>
        <PlayerWrapper>
          <VideoComponent url={props.url} />
        </PlayerWrapper>
      </Popover>
    </div>
  );
};

export default PopoverVideo;
