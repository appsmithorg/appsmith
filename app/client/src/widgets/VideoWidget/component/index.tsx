import ReactPlayer from "react-player";
import React, { Ref } from "react";
import styled from "styled-components";
import { createMessage, ENTER_VIDEO_URL } from "@appsmith/constants/messages";
export interface VideoComponentProps {
  url?: string;
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

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const Error = styled.span``;

export default function VideoComponent(props: VideoComponentProps) {
  const {
    autoplay,
    controls,
    onEnded,
    onError,
    onPause,
    onPlay,
    onProgress,
    onReady,
    onSeek,
    onStart,
    player,
    url,
  } = props;
  return url ? (
    <ReactPlayer
      controls={controls || true}
      height="100%"
      muted={autoplay}
      onEnded={onEnded}
      onError={onError}
      onPause={onPause}
      onPlay={onPlay}
      onProgress={onProgress}
      onReady={onReady}
      onSeek={onSeek}
      onStart={onStart}
      pip={false}
      playing={autoplay}
      ref={player}
      url={url}
      width="100%"
    />
  ) : (
    <ErrorContainer>
      <Error>{createMessage(ENTER_VIDEO_URL)}</Error>
    </ErrorContainer>
  );
}
