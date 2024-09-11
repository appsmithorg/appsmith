import React from "react";
import { Text } from "@appsmith/ads";
import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";
import { ContentBox } from "pages/AdminSettings/components";

const LinkPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox
      className="items-center p-4"
      style={{
        backgroundColor: shades?.background,
      }}
      title="Link Preview"
    >
      <ContentBox className="flex flex-col border justify-center w-full h-full gap-2 px-5 bg-white">
        <img
          alt="Branding Logo"
          className="inline-block h-4 mr-auto"
          src={logo as string}
        />
        <Text kind="body-s" renderAs="span">
          Application name
        </Text>
      </ContentBox>
    </PreviewBox>
  );
};

export default LinkPreview;
