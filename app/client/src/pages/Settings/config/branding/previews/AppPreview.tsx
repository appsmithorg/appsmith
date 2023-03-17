import React from "react";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const AppPreview = (props: PreviewsProps) => {
  const { logo } = props;

  return (
    <PreviewBox className="items-center p-4 bg-gray-100 " title="App">
      <div className="w-full h-full bg-white">
        <div className="flex flex-col">
          <header className="flex items-center gap-1 px-3 py-2 border-b">
            <AppsIcon className="w-6 h-6 p-1 text-gray-600 group-hover:bg-gray-100" />
            <img
              alt="Branding Logo"
              className="block h-4 t--branding-logo"
              src={logo as string}
            />
          </header>
        </div>
      </div>
    </PreviewBox>
  );
};

export default AppPreview;
