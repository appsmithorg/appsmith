export * from "ce/pages/AppViewer/KnowledgeBase/KBViewerFloatingButton";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Tooltip } from "design-system";
import type { ButtonProps } from "design-system";
import { AI_KB_MENU_CLICK, KB_BUTTON_TOOLTIP } from "./constants";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  getCurrentApplication,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { EKBProcessingStatus, type TApplicationKB } from "./types";
import { generateApplicationKBApi, getApplicationKBApi } from "./api";
import {
  getAnalyticsKBStatus,
  getIsKbGenerationPending,
  getIsPublishedKBPresent,
  getPublishedKbHash,
} from "./utils";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "@appsmith/utils/permissionHelpers";
import KBDrawer from "./KBDrawer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppKbState, initAppKbState } from "utils/storage";
import log from "loglevel";
import { useHistory } from "react-router";

// The other buttons in the header are not using the Button component from ADS 2.0
// Hence added a override for height to match the other buttons in the header.
interface ButtonWithBadgeProps extends ButtonProps {
  showBadge?: boolean;
}

const StyledDesktopButton = styled(Button)<ButtonWithBadgeProps>`
  position: relative;
  height: 30px !important;

  > div {
    padding: 4px;
  }
  &:active:not([data-disabled="true"]):not([data-loading="true"]) {
    border: 1px solid
      var(--ads-v2-colors-action-secondary-surface-default-border);
  }
  &::after {
    content: ${({ showBadge }) => (showBadge ? '""' : "none")};
    position: absolute;
    top: 6px;
    right: 3px;
    width: 9px;
    height: 9px;
    background-color: var(--ads-v2-color-bg-brand);
    border: 1px solid var(--ads-v2-color-white);
    border-radius: 50%;
  }
`;

export const KBViewerFloatingButton = React.memo(() => {
  const { location, push } = useHistory();
  const drawerOpenInitialValue = new URLSearchParams(location.search).get(
    "showKb",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    Boolean(drawerOpenInitialValue),
  );
  // Reference to the polling timeout.
  const pollingRef = React.useRef<number | null>(null);
  const applicationId = useSelector(getCurrentApplicationId);
  const isKBFeatureEnabled = useSelector((state) =>
    selectFeatureFlagCheck(state, "release_knowledge_base_enabled"),
  );
  const currentApplication = useSelector(getCurrentApplication);
  const currentPageId = useSelector(getCurrentPageId);
  const userPermissions = currentApplication?.userPermissions ?? [];
  const isUserAppBuilder = isPermitted(
    userPermissions,
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const [applicationKB, setApplicationKB] = useState<TApplicationKB | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasRead, setHasRead] = useState(true);

  const currentPageSlug = useMemo(() => {
    if (currentApplication && currentPageId) {
      const currentApplicationPages = currentApplication.pages;
      const currentPage = currentApplicationPages.find(
        (page) => page.id === currentPageId,
      );

      return currentPage?.slug || "";
    }
  }, [currentApplication, currentPageId]);

  const updateKBReadStatus = async () => {
    if (!applicationKB) {
      return;
    }

    const checksum = getPublishedKbHash(applicationKB);
    const pages = Object.keys(applicationKB.publishedKB);
    initAppKbState(applicationKB.applicationId, checksum, pages);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    AnalyticsUtil.logEvent(AI_KB_MENU_CLICK, {
      app_page_count: currentApplication?.pages.length || 0,
      kb_status: getAnalyticsKBStatus(applicationKB),
      selected_page_slug: currentPageSlug,
    });
    updateKBReadStatus();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setHasRead(true);
    const searchParams = new URLSearchParams(location.search);
    // Remove the showKb query param from the URL
    if (searchParams.has("showKb")) {
      searchParams.delete("showKb");
      push(`${location.pathname}?${searchParams.toString()}`);
    }
  };

  const onGenerateKB = async () => {
    setApplicationKB((prevAppKb) =>
      prevAppKb
        ? {
            ...prevAppKb,
            processingStatus: EKBProcessingStatus.IN_PROGRESS,
          }
        : null,
    );

    // Trigger the KB generation API
    setIsLoading(true);
    await generateApplicationKBApi(applicationId);
    setIsLoading(false);

    // If there is no polling timeout, then we need to start polling
    if (!pollingRef.current) {
      await pollApplicationKb();
    }
  };

  const computeApplicationKBReadStatus = useCallback(
    async (kb: TApplicationKB) => {
      const { applicationId } = kb;
      const appKbStateInDB = await getAppKbState(applicationId);
      const checksum = getPublishedKbHash(kb);
      const hasKBChanged = appKbStateInDB?.checksum !== checksum;

      if (hasKBChanged) {
        setHasRead(false);
      }
    },
    [applicationKB],
  );

  const pollApplicationKb = useCallback(async () => {
    if (!applicationId || !isKBFeatureEnabled) {
      return;
    }

    try {
      const response = await getApplicationKBApi(applicationId);
      setApplicationKB(response);
      const isPublishedKBPresent = getIsPublishedKBPresent(response);
      if (isPublishedKBPresent) {
        computeApplicationKBReadStatus(response);
      }

      const isKBGenerationPending = getIsKbGenerationPending(response);
      if (isKBGenerationPending) {
        pollingRef.current = setTimeout(pollApplicationKb, 10000);
        return;
      }

      // Clear the polling timeout reference if the KB generation is complete
      pollingRef.current = null;
    } catch (e) {
      log.error("Error while fetching KB", e);
    }
  }, [applicationId, isKBFeatureEnabled]);

  // Poll for KB generation status on mount and clear the polling timeout reference on unmount
  useEffect(() => {
    pollApplicationKb();

    return () => {
      // Clear the polling timeout reference if the component is unmounted
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [pollApplicationKb]);

  const isPublishedKBPresent = getIsPublishedKBPresent(applicationKB);

  // If applicationId is not present, then we don't need to render the button
  if (!applicationId) {
    return null;
  }

  // If the KB feature is not enabled, then we don't need to render the button
  if (!isKBFeatureEnabled) {
    return null;
  }

  // If the user is not an app builder and the published KB is empty, then we don't need to render the button
  if (!isUserAppBuilder && !isPublishedKBPresent) {
    return null;
  }

  return (
    <>
      <Tooltip content={KB_BUTTON_TOOLTIP}>
        <StyledDesktopButton
          className="ml-3"
          kind="secondary"
          onClick={openDrawer}
          showBadge={!hasRead}
          size="sm"
          startIcon="book-line"
        />
      </Tooltip>
      {isDrawerOpen && (
        <KBDrawer
          applicationKB={applicationKB}
          currentPageSlug={currentPageSlug}
          hasRead={hasRead}
          isLoading={isLoading}
          isUserAppBuilder={isUserAppBuilder}
          onClose={closeDrawer}
          onGenerateKB={onGenerateKB}
        />
      )}
    </>
  );
});
