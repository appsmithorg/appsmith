import React from "react";
import PreviewBox from "./PreviewBox";

import AddIcon from "remixicon-react/AddFillIcon";

import { PreviewsProps } from ".";

const FaviconPreview = (props: PreviewsProps) => {
  const { favicon } = props;

  return (
    <PreviewBox className="items-center p-4 bg-gray-100 " title="Browser tab">
      <div className="w-full h-full bg-white">
        <div className="flex items-center gap-2 px-4 pt-2 bg-gray-200 ">
          <div className="flex items-center gap-2 px-3 py-2 bg-white w-fit">
            <img
              alt="Branding Logo"
              className="w-3 h-3 t--branding-favicon"
              src={favicon}
            />
            <span className="text-xs">Application Name</span>
          </div>
          <AddIcon className="w-4 h-4" />
        </div>
        <div className="p-3 border-b h-11">
          <div className="w-full h-full bg-gray-100" />
        </div>
      </div>
    </PreviewBox>
  );
};

export default FaviconPreview;
