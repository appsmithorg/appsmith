import React from "react";
import GifPlayer from "react-gif-player";
import "react-gif-player/dist/gifplayer.css";

type GifPlayerProps = {
  gif: string;
  autoPlay?: boolean;
};
const GifPlayerComponent = (props: GifPlayerProps) => {
  return <GifPlayer gif={props.gif} autoPlay={props.autoPlay || false} />;
};

export default GifPlayerComponent;
