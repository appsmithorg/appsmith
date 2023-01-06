import {
  NotificationBanner,
  NotificationBannerProps,
  NotificationVariant,
  Text,
  TextType,
} from "design-system";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function PushFailedWarning({ closeHandler, error }: any) {
  const notificationBannerOptions: NotificationBannerProps = {
    canClose: true,
    className: "error",
    icon: "warning-line",
    onClose: () => closeHandler(),
    variant: NotificationVariant.error,
    learnMoreClickHandler: null,
  };
  return (
    <Container>
      <NotificationBanner {...notificationBannerOptions}>
        <>
          <Text type={TextType.H5}>{error.errorType}</Text>
          <br />
          <Text type={TextType.P3}>{error.message}</Text>
        </>
      </NotificationBanner>
    </Container>
  );
}
