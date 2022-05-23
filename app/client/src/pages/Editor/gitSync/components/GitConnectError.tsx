import React, { useEffect } from "react";
import styled from "constants/DefaultTheme";
import { useSelector } from "store";
import {
  getConnectingErrorDocUrl,
  getGitConnectError,
} from "selectors/gitSyncSelectors";
import {
  NotificationBanner,
  NotificationBannerProps,
  NotificationVariant,
} from "../../../../components/ads/NotificationBanner";

const NotificationContainer = styled.div`
  margin-top: 16px;
  max-width: calc(100% - 30px);
`;

export default function GitConnectError({
  onClose,
  onDisplay,
}: {
  onClose?: () => void;
  onDisplay?: () => void;
}) {
  const error = useSelector(getGitConnectError);
  const connectingErrorDocumentUrl = useSelector(getConnectingErrorDocUrl);
  const titleMessage = error?.errorType
    ? error.errorType.replaceAll("_", " ")
    : "";

  useEffect(() => {
    if (error && onDisplay) {
      onDisplay();
    }
  }, [error]);

  const learnMoreClickHandler = () =>
    window.open(connectingErrorDocumentUrl, "_blank");

  const notificationBannerOptions: NotificationBannerProps = {
    canClose: true,
    className: "error",
    icon: "warning-line",
    learnMoreClickHandler,
    onClose: onClose,
    variant: NotificationVariant.error,
  };

  return error ? (
    <NotificationContainer className="t--git-connection-error">
      <NotificationBanner {...notificationBannerOptions}>
        <div style={{ marginBottom: "8px" }}>{titleMessage}</div>
        <div style={{ marginBottom: "8px" }}>{error?.message}</div>
      </NotificationBanner>
    </NotificationContainer>
  ) : null;
}
