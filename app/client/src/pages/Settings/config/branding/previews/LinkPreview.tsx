import React from "react";

import { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const LinkPreview = (props: PreviewsProps) => {
  const { logo } = props;

  return (
    <PreviewBox className="items-center p-4 bg-gray-100 " title="Link Preview">
      <div className="flex flex-col justify-center w-full h-full gap-2 px-5 bg-white">
        <img
          alt="Branding Logo"
          className="inline-block h-4 mr-auto"
          src={logo as string}
        />
        <p>Application name</p>
      </div>
    </PreviewBox>
  );
};

export default LinkPreview;
