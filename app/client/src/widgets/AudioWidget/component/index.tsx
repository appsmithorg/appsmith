import ReactPlayer from "react-player";
import type { Ref } from "react";
import React from "react";
import styled from "styled-components";

import { createMessage, ENTER_AUDIO_URL } from "ee/constants/messages";

export interface AudioComponentProps {
  url?: string;
  playing?: boolean;
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

export default function AudioComponent(props: AudioComponentProps) {
  const {
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
    playing,
    url,
  } = props;
  return url ? (
    <ReactPlayer
      config={{
        file: {
          attributes: {
            controlsList:
              "nofullscreen nodownload noremoteplayback noplaybackrate",
          },
        },
      }}
      controls={controls || true}
      height="100%"
      onEnded={onEnded}
      onError={onError}
      onPause={onPause}
      onPlay={onPlay}
      onProgress={onProgress}
      onReady={onReady}
      onSeek={onSeek}
      onStart={onStart}
      pip={false}
      playing={playing}
      ref={player}
      url={url}
      width="100%"
    />
  ) : (
    <ErrorContainer>
      <span>{createMessage(ENTER_AUDIO_URL)}</span>
    </ErrorContainer>
  );
}
