import {
  NotificationBanner,
  NotificationBannerProps,
  NotificationVariant,
} from "components/ads/NotificationBanner";
import React from "react";
import {
  createMessage,
  DISCARD_CHANGES_WARNING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Text, { TextType } from "../../../../components/ads/Text";

function DiscardWarningMessage() {
  return (
    <Text color={Colors.ERROR_600} type={TextType.P3}>
      {createMessage(DISCARD_CHANGES_WARNING)}
    </Text>
  );
}

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardChangesWarning({
  onCloseDiscardChangesWarning,
}: any) {
  const notificationBannerOptions: NotificationBannerProps = {
    canClose: true,
    className: "error",
    icon: "warning-line",
    onClose: () => onCloseDiscardChangesWarning(),
    variant: NotificationVariant.error,
    learnMoreClickHandler: () => false,
  };
  return (
    <Container>
      <NotificationBanner {...notificationBannerOptions}>
        <DiscardWarningMessage />
      </NotificationBanner>
    </Container>
  );
}
