import React from "react";

export interface AssetLoaderProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

// TODO: make it polymorphic to accept audio and video tags
export const getAssetUrl = (src: string) => {
  return src;
};

export function AssetLoader(props: AssetLoaderProps) {
  return <img {...props} />;
}

export default React.memo(AssetLoader);
