import { ControlIcons } from "icons/ControlIcons";
import styled, { AnyStyledComponent } from "styled-components";
import { Colors } from "constants/Colors";
import ReactPlayer from "react-player";
import React, { Ref } from "react";

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
  autoplay?: boolean;
  controls?: boolean;
  onStart?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  onProgress?: () => void;
  onSeek?: () => void;
  onError?: () => void;
  player?: Ref<ReactPlayer>;
}

export default function VideoComponent(props: VideoComponentProps) {
  const {
    url,
    autoplay,
    controls,
    onStart,
    onPlay,
    onPause,
    onEnded,
    onReady,
    onProgress,
    onSeek,
    onError,
    player,
  } = props;
  return (
    <>
      <ReactPlayer
        url={url}
        ref={player}
        playing={autoplay}
        controls={controls || true}
        onStart={onStart}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onReady={onReady}
        onProgress={onProgress}
        onSeek={onSeek}
        onError={onError}
        width="100%"
        height="100%"
        pip={false}
      />
    </>
  );
}
