import React from "react";
import { Text } from "@appsmith/ads";
import PreviewBox from "./PreviewBox";
import type { PreviewsProps } from ".";
import { ContentBox } from "pages/AdminSettings/components";
import { importRemixIcon } from "@appsmith/ads-old";

const DashboardThumbnail = (props: PreviewsProps) => {
  const { shades } = props;

  const UserIcon = importRemixIcon(
    async () => import("remixicon-react/User3FillIcon"),
  );

  return (
    <PreviewBox className="items-center p-4" title="Dashboard Thumbnail">
      <ContentBox
        className="flex items-center justify-between border w-full h-full gap-2 px-5"
        style={{
          backgroundColor: shades.background,
        }}
      >
        <Text color="var(--ads-v2-color-fg)" kind="heading-m" renderAs="span">
          Application name
        </Text>
        <div
          className="p-2 border rounded-full"
          style={{
            borderColor: "var(--ads-v2-color-border)",
          }}
        >
          <UserIcon className="w-3 h-3" />
        </div>
      </ContentBox>
    </PreviewBox>
  );
};

export default DashboardThumbnail;
