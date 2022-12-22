import React from "react";
import PreviewBox from "./PreviewBox";

import { PreviewsProps } from ".";

const NotFoundPreview = (props: PreviewsProps) => {
  const { shades } = props;

  return (
    <PreviewBox className="items-center p-4 bg-gray-100 " title="404 page">
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-3 px-5"
        style={{
          backgroundColor: shades.background,
        }}
      >
        <div className="flex items-center justify-center h-10 font-semibold bg-white border aspect-square">
          <p
            style={{
              color: shades.primary,
            }}
          >
            404
          </p>
        </div>
        <div
          className="h-3 mt-2 rounded-sm w-7 t--branding-bg"
          style={{
            backgroundColor: shades.primary,
          }}
        />
      </div>
    </PreviewBox>
  );
};

export default NotFoundPreview;
