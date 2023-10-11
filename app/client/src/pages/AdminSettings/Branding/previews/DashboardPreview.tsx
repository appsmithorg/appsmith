import { ContentBox } from "pages/AdminSettings/components";
import React from "react";

import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const DashboardPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox
      className="items-center p-4"
      style={{
        backgroundColor: shades?.background,
      }}
      title="Home"
    >
      <div className="w-full h-full bg-white">
        <div className="flex flex-col">
          <ContentBox className="px-3 py-2 border-b rounded-none">
            <img
              alt="Branding Logo"
              className="block h-4 t--branding-logo"
              src={logo as string}
            />
          </ContentBox>
          <main className="flex items-center justify-end gap-2 px-3">
            <ContentBox className="h-3 border mt-2 w-7" />
            <ContentBox
              className="h-3 mt-2 w-7 t--branding-bg"
              style={{
                backgroundColor: shades.primary,
              }}
            />
          </main>
        </div>
      </div>
    </PreviewBox>
  );
};

export default DashboardPreview;
