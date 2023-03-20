import React from "react";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import type { VideoComponentProps } from "./";
import VideoComponent from "./";
import styled from "styled-components";
import { Icon } from "design-system";

const PlayIcon = styled(Icon)`
  position: relative;
  cursor: pointer;
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
        <PlayIcon className="play-icon" name="play-video" />
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
