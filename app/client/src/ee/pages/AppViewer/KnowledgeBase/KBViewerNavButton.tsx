import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Tooltip } from "design-system";
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
} from "./utils";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "@appsmith/utils/permissionHelpers";
import KBDrawer from "./KBDrawer";
import AnalyticsUtil from "utils/AnalyticsUtil";

// The other buttons in the header are not using the Button component from ADS 2.0
// Hence added a override for height to match the other buttons in the header.
const StyledDesktopButton = styled(Button)`
  height: 30px !important;
`;

export const KBViewerNavButton = React.memo(() => {
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [applicationKb, setApplicationKb] = useState<TApplicationKB | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentPageSlug = useMemo(() => {
    if (currentApplication && currentPageId) {
      const currentApplicationPages = currentApplication.pages;
      const currentPage = currentApplicationPages.find(
        (page) => page.id === currentPageId,
      );

      return currentPage?.slug || "";
    }
  }, [currentApplication, currentPageId]);

  const toggleIsDrawerOpen = () => {
    if (!isDrawerOpen) {
      // If isDrawerOpen is false, then the drawer is opening
      // and we need to log the event
      AnalyticsUtil.logEvent(AI_KB_MENU_CLICK, {
        app_page_count: currentApplication?.pages.length || 0,
        kb_status: getAnalyticsKBStatus(applicationKb),
        selected_page_slug: currentPageSlug,
      });
    }

    setIsDrawerOpen((prev) => !prev);
  };

  const onGenerateKB = async () => {
    setApplicationKb((prevAppKb) =>
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

  const isPublishedKBPresent = getIsPublishedKBPresent(applicationKb);

  const pollApplicationKb = useCallback(async () => {
    if (!applicationId || !isKBFeatureEnabled) {
      return;
    }
    const response = await getApplicationKBApi(applicationId);
    setApplicationKb(response);

    const isKBGenerationPending = getIsKbGenerationPending(response);
    if (isKBGenerationPending) {
      pollingRef.current = setTimeout(pollApplicationKb, 10000);
      return;
    }

    // Clear the polling timeout reference if the KB generation is complete
    pollingRef.current = null;
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

  // If the published KB is empty, then we need to render a smaller drawer size. This is the design spec.
  const DRAWER_SIZE = isPublishedKBPresent ? "500px" : "400px";

  return (
    <>
      <Tooltip content={KB_BUTTON_TOOLTIP}>
        <StyledDesktopButton
          kind="tertiary"
          onClick={toggleIsDrawerOpen}
          size="md"
          startIcon="book-line"
        />
      </Tooltip>
      {isDrawerOpen && (
        <KBDrawer
          applicationKB={applicationKb}
          currentPageSlug={currentPageSlug}
          isLoading={isLoading}
          isUserAppBuilder={isUserAppBuilder}
          onClose={toggleIsDrawerOpen}
          onGenerateKB={onGenerateKB}
          size={DRAWER_SIZE}
        />
      )}
    </>
  );
});
