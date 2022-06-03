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
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
}

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const VideoWrapper = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
  backgroundColor?: string;
}>`
  height: 100%;

  & video,
  & > div {
    background-color: ${({ backgroundColor }) => backgroundColor};
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => boxShadow} !important;
    overflow: hidden;
  }
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
    <VideoWrapper
      backgroundColor={props.backgroundColor}
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
    >
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
    </VideoWrapper>
  ) : (
    <ErrorContainer>
      <Error>{createMessage(ENTER_VIDEO_URL)}</Error>
    </ErrorContainer>
  );
}
