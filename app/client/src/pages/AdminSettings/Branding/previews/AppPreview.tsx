import { ContentBox } from "pages/AdminSettings/components";
import React from "react";

import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";
import { Icon } from "@appsmith/ads";

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
            <Icon className="p-1" name="apps-line" size="md" />
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
