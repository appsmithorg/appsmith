import React from "react";

import { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const DashboardPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox className="items-center p-4 bg-gray-100 " title="Home">
      <div className="w-full h-full bg-white">
        <div className="flex flex-col">
          <header className="px-3 py-2 border-b">
            <img
              alt="Branding Logo"
              className="block h-4 t--branding-logo"
              src={logo as string}
            />
          </header>
          <main className="flex items-center justify-end gap-2 px-3">
            <div className="h-3 mt-2 border border-gray-300 rounded-sm w-7" />
            <div
              className="h-3 mt-2 rounded-sm w-7 t--branding-bg"
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
