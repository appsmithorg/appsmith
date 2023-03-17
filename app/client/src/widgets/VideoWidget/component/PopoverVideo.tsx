import React from "react";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import type { VideoComponentProps } from "./";
import VideoComponent from "./";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";

const PlayIcon = styled(ControlIcons.PLAY_VIDEO)`
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

const PlayerWrapper = styled.div`
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
