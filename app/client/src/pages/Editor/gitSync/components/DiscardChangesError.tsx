import { Colors } from "constants/Colors";
import type { NotificationBannerProps } from "design-system-old";
import {
  NotificationBanner,
  NotificationVariant,
  Text,
  TextType,
} from "design-system-old";
import React from "react";
import type { GitErrorType } from "reducers/uiReducers/gitSyncReducer";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardFailedWarning({
  closeHandler,
  error,
}: {
  closeHandler: () => void;
  error: GitErrorType["error"];
}) {
  const notificationBannerOptions: NotificationBannerProps = {
    canClose: true,
    icon: "warning-line",
    className: "error",
    onClose: () => closeHandler(),
    variant: NotificationVariant.error,
    style: {
      alignItems: "start",
    },
  };
  return (
    <Container data-cy={"discard-error"}>
      <NotificationBanner {...notificationBannerOptions}>
        <Text color={Colors.ERROR_600} type={TextType.P3}>
          {error.message}
        </Text>
      </NotificationBanner>
    </Container>
  );
}
