import { ContentBox } from "pages/Settings/components";
import React from "react";

import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";
import { importRemixIcon } from "design-system-old";

const AppsIcon = importRemixIcon(() => import("remixicon-react/AppsLineIcon"));

const AppPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox
      className="items-center p-4"
      style={{
        backgroundColor: shades?.background,
      }}
      title="App"
    >
      <div className="w-full h-full bg-white">
        <div className="flex flex-col">
          <ContentBox className="flex items-center gap-1 px-3 py-2  border-b rounded-none">
            <AppsIcon className="w-6 h-6 p-1 text-gray-600 group-hover:bg-gray-100" />
            <img
              alt="Branding Logo"
              className="block h-4 t--branding-logo"
              src={logo as string}
            />
          </ContentBox>
        </div>
      </div>
    </PreviewBox>
  );
};

export default AppPreview;
