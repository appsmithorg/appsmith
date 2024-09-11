import React from "react";
import { Text } from "@appsmith/ads";
import type { PreviewsProps } from ".";
import PreviewBox from "./PreviewBox";
import { ContentBox } from "pages/AdminSettings/components";

const EmailPreview = (props: PreviewsProps) => {
  const { logo, shades } = props;

  return (
    <PreviewBox
      className="items-end"
      style={{
        backgroundColor: shades.background,
      }}
      title="E-mail"
    >
      <ContentBox className="w-7/12 bg-white border-l border-r border-t b h-4/5">
        <div className="flex flex-col gap-3 pt-6 px-9">
          <img
            alt="Branding Logo"
            className="block h-4 m-auto t--branding-logo"
            src={logo as string}
          />
          <Text
            color="var(--ads-v2-color-fg)"
            renderAs="p"
            style={{
              fontSize: "8px",
            }}
          >
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nostrum
            quas quos cumque sit hic unde deserunt
          </Text>
          <ContentBox
            className="flex items-center justify-center h-4 mt-2 t--branding-bg"
            style={{
              backgroundColor: shades.primary,
            }}
          />
        </div>
      </ContentBox>
    </PreviewBox>
  );
};

export default EmailPreview;
