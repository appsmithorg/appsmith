import { tailwindLayers } from "constants/Layers";
import React from "react";
import { useSelector } from "react-redux";
import { commentModeSelector } from "selectors/commentsSelectors";
import AppCommentsHeader from "./AppCommentsHeader";
import AppCommentThreads from "./AppCommentThreads";
import { Colors } from "constants/Colors";
import { IconSize } from "components/ads";
import { BannerMessage } from "components/ads/BannerMessage";

function AppComments() {
  const isCommentMode = useSelector(commentModeSelector);

  if (!isCommentMode) return null;

  return (
    <div
      className={`absolute top-0 left-0 flex flex-col w-full h-full bg-white ${tailwindLayers.appComments}`}
    >
      <AppCommentsHeader />
      <BannerMessage
        backgroundColor={Colors.WARNING_ORANGE}
        className="t--deprecation-warning"
        ctaText={"Read more about it here"}
        ctaURL={
          "https://appsmith.notion.site/Deprecating-real-time-commenting-60a307d2c5e1485b85ff95afebb616eb"
        }
        icon="warning-line"
        iconColor={Colors.WARNING_SOLID}
        iconSize={IconSize.XXXXL}
        message={"We are removing comments from Appsmith in v1.7.11"}
        messageHeader={"Comments are being deprecated"}
        textColor={Colors.BROWN}
      />
      <AppCommentThreads />
    </div>
  );
}

export default AppComments;
