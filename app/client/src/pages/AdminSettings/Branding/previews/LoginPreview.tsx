import { ContentBox } from "pages/AdminSettings/components";
import React from "react";

import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";

const LoginPreview = (props: PreviewsProps) => {
  const { shades } = props;

  return (
    <PreviewBox
      className="items-end"
      style={{
        backgroundColor: shades?.background,
      }}
      title="Login screen"
    >
      <ContentBox className="w-7/12 bg-white border-l border-r border-t h-4/5">
        <div className="flex flex-col gap-3 pt-6 px-9">
          {/*<img*/}
          {/*  alt="Logo"*/}
          {/*  className="block h-4 m-auto t--branding-logo"*/}
          {/*  src={logo as string}*/}
          {/*/>*/}
          <ContentBox className="h-4 border" />
          <ContentBox className="h-4 border" />
          <ContentBox
            className="flex items-center justify-center h-4 mt-2 t--branding-bg"
            style={{
              backgroundColor: shades?.primary,
            }}
          />
        </div>
      </ContentBox>
    </PreviewBox>
  );
};

export default LoginPreview;
