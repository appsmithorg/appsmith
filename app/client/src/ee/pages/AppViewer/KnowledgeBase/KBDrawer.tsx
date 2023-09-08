import React, { useCallback, useEffect, useState } from "react";
import { Button, Divider, Link, Spinner, Text, Callout } from "design-system";
import type { KBDrawerBodyProps, KBDrawerProps, TApplicationKB } from "./types";
import KBPreview from "./KBPreview";
import {
  getAnalyticsKBStatus,
  getIsKbGenerationIdle,
  getIsKbGenerationPending,
  getIsPublishedKBPresent,
  getPagesArray,
  getPublishedKbHash,
} from "./utils";
import { Drawer } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/editorSelectors";
import {
  AI_KB_GENERATE_CLICK,
  AI_KB_PREVIEW,
  AI_KB_REGENERATE_CLICK,
} from "./constants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppKbState, initAppKbState } from "utils/storage";

const GenerateKBSection = ({
  onGenerate,
  showRegenerate,
}: {
  onGenerate: (isRegenerate?: boolean) => void;
  showRegenerate: boolean;
}) => {
  if (showRegenerate) {
    return (
      <div className="flex justify-end">
        <Link kind="secondary" onClick={() => onGenerate(true)}>
          Re-generate
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div>
        <Text kind="body-m">
          Generate a new knowledge base for your application using Appsmith AI.
        </Text>
      </div>
      <div className="mt-4">
        <Button kind="primary" onClick={() => onGenerate()} size="md">
          Generate a knowledge base
        </Button>
      </div>
    </div>
  );
};

const KBProcessingView = () => {
  return (
    <div>
      <div>
        <Button isLoading kind="primary" size="md">
          Loading
        </Button>
      </div>
      <div className="mt-4">
        <Text kind="body-s">
          We are generating the knowledge base for you, this activity can take
          up to 10 minutes. Please come back after some time to review it.
        </Text>
      </div>
    </div>
  );
};

const KBDrawerBody = (props: KBDrawerBodyProps) => {
  const { appKb, currentPageSlug, isLoading, isUserAppBuilder, onGenerateKB } =
    props;
  const [selectedPage, setSelectedPage] = useState<string>("");
  const currentApplication = useSelector(getCurrentApplication);

  const handleGenerate = (isRegenerate = false) => {
    // Send analytics event and then call onGenerateKB function
    const analyticsEventName = isRegenerate
      ? AI_KB_REGENERATE_CLICK
      : AI_KB_GENERATE_CLICK;

    const mixpanelEventPayload: Record<string, string | number> = {
      kb_status: getAnalyticsKBStatus(appKb),
      app_page_count: currentApplication?.pages.length || 0,
    };

    if (isRegenerate) {
      mixpanelEventPayload.selected_page_slug = selectedPage;
    }

    AnalyticsUtil.logEvent(analyticsEventName, mixpanelEventPayload);

    onGenerateKB();
  };

  const handlePageSelect = (pageSlug: string) => {
    const isKBPresent = getIsPublishedKBPresent(appKb);

    if (appKb && isKBPresent && pageSlug && currentApplication) {
      // Send KB_PREVIEW event if KB is present and a page is selected
      const mixpanelEventPayload = {
        app_page_count: currentApplication?.pages.length || 0,
        kb_page_count: getPagesArray(appKb.publishedKB).length,
        selected_page_slug: pageSlug,
      };

      AnalyticsUtil.logEvent(AI_KB_PREVIEW, mixpanelEventPayload);
    }

    setSelectedPage(pageSlug);
  };

  useEffect(() => {
    // Select KB of the current page in view if no page is selected
    // This is to ensure that the KB of the current page is always visible
    if (currentPageSlug) {
      handlePageSelect(currentPageSlug);
    }
  }, [currentPageSlug]);

  if (!appKb) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <Spinner size={30} />
      </div>
    );
  }

  const isPublishedKBPresent = getIsPublishedKBPresent(appKb);
  const isKBGenerationPending =
    (getIsKbGenerationPending(appKb) || isLoading) && isUserAppBuilder;

  return (
    <>
      {isUserAppBuilder &&
        (isKBGenerationPending ? (
          <KBProcessingView />
        ) : (
          <GenerateKBSection
            onGenerate={handleGenerate}
            showRegenerate={isPublishedKBPresent}
          />
        ))}

      {isPublishedKBPresent && (
        <KBPreview
          appKb={appKb}
          isKBGenerationPending={isKBGenerationPending}
          onPageSelect={handlePageSelect}
          selectedPage={selectedPage}
          showSuccessCallout={props.showSuccessCallout}
        />
      )}
    </>
  );
};

const MemomisedKBDrawer = React.memo(
  ({
    applicationKB,
    currentPageSlug,
    isLoading,
    isUserAppBuilder,
    onClose,
    onGenerateKB,
    size,
  }: KBDrawerProps) => {
    const [showSuccessCallout, setShowSuccessCallout] = useState(false);
    const successCalloutTimeoutId = React.useRef<number | null>(null);

    const showKbGenerationCallout = useCallback(() => {
      if (!isUserAppBuilder) return;

      setShowSuccessCallout(true);

      const timeoutId = setTimeout(() => {
        setShowSuccessCallout(false);
        successCalloutTimeoutId.current = null;
      }, 5000);

      successCalloutTimeoutId.current = timeoutId;
    }, [isUserAppBuilder]);

    const setAppKBStateInDB = useCallback(
      async (appKb: TApplicationKB) => {
        const checksum = getPublishedKbHash(appKb);

        if (!currentPageSlug) return;

        const pages = Object.keys(appKb.publishedKB);

        initAppKbState(appKb.applicationId, checksum, pages);
      },
      [currentPageSlug],
    );

    const onKBGenerationViewed = useCallback(
      async (applicationKB: TApplicationKB) => {
        const { applicationId } = applicationKB;
        const appKbStateInDB = await getAppKbState(applicationId);
        const checksum = getPublishedKbHash(applicationKB);
        const hasKBChanged = appKbStateInDB?.checksum !== checksum;

        if (hasKBChanged) {
          setAppKBStateInDB(applicationKB);
          showKbGenerationCallout();
        }
      },
      [],
    );

    useEffect(() => {
      const isPublishedKBPresent = getIsPublishedKBPresent(applicationKB);

      if (
        applicationKB &&
        isPublishedKBPresent &&
        getIsKbGenerationIdle(applicationKB)
      ) {
        onKBGenerationViewed(applicationKB);
      }

      return () => {
        if (successCalloutTimeoutId.current) {
          clearTimeout(successCalloutTimeoutId.current);
        }
      };
    }, [applicationKB]);

    return (
      <Drawer canOutsideClickClose isOpen onClose={onClose} size={size}>
        <div className="p-4 pb-0">
          <div className="flex justify-between">
            <div>
              <div>
                <Text kind="heading-m">Knowledge base</Text>
              </div>
              <div>
                <Text kind="body-s">
                  AI generated knowledge base for your application.
                </Text>
              </div>
            </div>
            <div>
              <Button
                isIconButton
                kind="tertiary"
                onClick={onClose}
                startIcon="close-line"
              />
            </div>
          </div>

          {showSuccessCallout && (
            <Callout className="mt-3 w-fit" kind="success">
              Knowledgebase was successfully generated
            </Callout>
          )}
          <div className="mt-1">
            <Divider />
          </div>
        </div>
        <div className="p-4 pt-2 bp3-drawer-body">
          <KBDrawerBody
            appKb={applicationKB}
            currentPageSlug={currentPageSlug}
            isLoading={isLoading}
            isUserAppBuilder={isUserAppBuilder}
            onGenerateKB={onGenerateKB}
            showSuccessCallout={showSuccessCallout}
          />
        </div>
      </Drawer>
    );
  },
);

export default MemomisedKBDrawer;
