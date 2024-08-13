import React from "react";
import PreviewBox from "./PreviewBox";
import { Icon, Text } from "@appsmith/ads";
import type { PreviewsProps } from ".";
import { ContentBox } from "pages/AdminSettings/components";

const FaviconPreview = (props: PreviewsProps) => {
  const { favicon, shades } = props;

  return (
    <PreviewBox
      className="items-center p-4"
      style={{
        backgroundColor: shades?.background,
      }}
      title="Browser tab"
    >
      <ContentBox className="w-full h-full border bg-white">
        <div
          className="flex items-center gap-2 px-4 pt-2"
          style={{
            backgroundColor: "var(--ads-v2-color-bg-muted)",
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-white w-fit">
            <img
              alt="Branding Logo"
              className="w-3 h-3 t--branding-favicon"
              src={favicon}
            />
            <Text kind="body-s" renderAs="span">
              Application name
            </Text>
          </div>
          <Icon name="add-line" size="md" />
        </div>
        <ContentBox className="p-3 border-b h-11">
          <div
            className="w-full h-full"
            style={{
              backgroundColor: "var(--ads-v2-color-bg-muted)",
            }}
          />
        </ContentBox>
      </ContentBox>
    </PreviewBox>
  );
};

export default FaviconPreview;
