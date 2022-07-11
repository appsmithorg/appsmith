import {
  NotificationBanner,
  NotificationBannerProps,
  NotificationVariant,
} from "components/ads/NotificationBanner";
import React from "react";
import {
  createMessage,
  CURRENT_PAGE_DISCARD_WARNING,
  DISCARD_CHANGES_WARNING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Text, TextType } from "design-system";
import { useSelector } from "react-redux";
import { getCurrentPageName } from "selectors/editorSelectors";
import { getGitStatus } from "selectors/gitSyncSelectors";

function DiscardWarningMessage() {
  return (
    <Text color={Colors.ERROR_600} type={TextType.P3}>
      {createMessage(DISCARD_CHANGES_WARNING)}
    </Text>
  );
}

function CurrentPageDiscardWarningMessage({
  isCurrentPageDiscardable,
  pageName,
}: {
  isCurrentPageDiscardable: boolean;
  pageName: string;
}) {
  const out = isCurrentPageDiscardable ? (
    <Text color={Colors.ERROR_600} type={TextType.P3}>
      {createMessage(CURRENT_PAGE_DISCARD_WARNING, pageName)}
    </Text>
  ) : null;

  return out;
}

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardChangesWarning({
  discardDocUrl,
  onCloseDiscardChangesWarning,
}: any) {
  const currentPageName = useSelector(getCurrentPageName) || "";
  const modifiedPageList = useSelector(
    getGitStatus,
  )?.modified.map((page: string) => page.toLocaleLowerCase());
  const isCurrentPageDiscardable =
    modifiedPageList?.some((page: string) =>
      page.includes(currentPageName.toLocaleLowerCase()),
    ) || false;

  const notificationBannerOptions: NotificationBannerProps = {
    canClose: true,
    className: "error",
    icon: "warning-line",
    onClose: () => onCloseDiscardChangesWarning(),
    variant: NotificationVariant.error,
    learnMoreClickHandler: () => window.open(discardDocUrl, "_blank"),
  };
  return (
    <Container>
      <NotificationBanner {...notificationBannerOptions}>
        <>
          <DiscardWarningMessage />
          <br />
          <CurrentPageDiscardWarningMessage
            isCurrentPageDiscardable={isCurrentPageDiscardable}
            pageName={currentPageName}
          />
        </>
      </NotificationBanner>
    </Container>
  );
}
