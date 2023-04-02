import React from "react";

export interface ImageLoaderProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function ImageLoader(props: ImageLoaderProps) {
  return <img {...props} />;
}

export default React.memo(ImageLoader);
