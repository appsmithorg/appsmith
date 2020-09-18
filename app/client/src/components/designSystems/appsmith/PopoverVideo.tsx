import React from "react";
import {
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import VideoComponent, { VideoComponentProps } from "./VideoComponent";

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
        <VideoComponent url={props.url}></VideoComponent>
      </Popover>
    </div>
  );
};

export default PopoverVideo;
