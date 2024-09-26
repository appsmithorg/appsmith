import React from "react";
import { Text } from "@appsmith/ads";
import PreviewBox from "./PreviewBox";
import type { PreviewsProps } from ".";
import { ContentBox } from "pages/AdminSettings/components";

const NotFoundPreview = (props: PreviewsProps) => {
  const { shades } = props;

  return (
    <PreviewBox
      className="items-end"
      style={{
        backgroundColor: shades?.background,
      }}
      title="404 page"
    >
      <ContentBox className="flex flex-col items-center justify-center bg-white border-t border-l border-r w-7/12 h-4/5">
        <div className="flex items-center justify-center h-8 font-semibold">
          <Text
            kind="heading-s"
            renderAs="p"
            style={{
              color: shades.primary,
            }}
          >
            404
          </Text>
        </div>
        <ContentBox
          className="h-3 mt-1 w-10 t--branding-bg"
          style={{
            backgroundColor: shades.primary,
          }}
        />
      </ContentBox>
    </PreviewBox>
  );
};

export default NotFoundPreview;
