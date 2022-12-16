import React from "react";

import { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const LoginPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox
      className="items-end"
      style={{
        backgroundColor: shades?.background,
      }}
      title="Login screen"
    >
      <div
        className="w-7/12 bg-white border-t-4 border-l border-r h-4/5"
        style={{
          borderTopColor: shades?.primary,
        }}
      >
        <div className="flex flex-col gap-3 pt-6 px-9">
          <img
            alt="Logo"
            className="block h-4 m-auto t--branding-logo"
            src={logo as string}
          />
          <div className="h-4 border rounded-sm" />
          <div className="h-4 border rounded-sm" />
          <div
            className="flex items-center justify-center h-4 mt-2 rounded-sm t--branding-bg"
            style={{
              backgroundColor: shades?.primary,
            }}
          >
            <div
              className="w-3/12 h-1 rounded-sm"
              style={{
                backgroundColor: shades?.font,
              }}
            />
          </div>
        </div>
      </div>
    </PreviewBox>
  );
};

export default LoginPreview;
