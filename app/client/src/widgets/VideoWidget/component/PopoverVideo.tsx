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

/**
 * Play control size for table video cells (PopoverVideo is only used from
 * tables). 30px matches the restored Icon Button size; cell padding is
 * zeroed so the control fits the row.
 * @see https://github.com/appsmithorg/appsmith-ee/issues/10561
 */
export const TABLE_VIDEO_PLAY_ICON_SIZE = 30;

const PlayIcon = styled(ControlIcons.PLAY_VIDEO)`
  position: relative;
  cursor: pointer;

  img {
    height: ${TABLE_VIDEO_PLAY_ICON_SIZE}px !important;
    width: ${TABLE_VIDEO_PLAY_ICON_SIZE}px !important;
  }

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
