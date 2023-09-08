import React, { useCallback, useEffect, useState } from "react";
import type { TApplicationKB } from "./types";
import { Text, Icon } from "design-system";
import { getPagesArray } from "./utils";
import classNames from "classnames";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  getCurrentApplication,
  getCurrentApplicationId,
} from "selectors/editorSelectors";
import { getAppKbState, reactToPageKB } from "utils/storage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import isNull from "lodash/isNull";

const FeedbackContainer = styled.div`
  background: var(--ads-v2-color-blue-100);
`;

const FeedbackCallout = ({
  appKb,
  isKBGenerationPending,
  pageSlug,
  selectedPage,
  showSuccessCallout,
}: {
  pageSlug: string;
  showSuccessCallout: boolean;
  selectedPage: string;
  appKb: TApplicationKB;
  isKBGenerationPending: boolean;
}) => {
  const [appKBState, setAppKBState] = useState<Record<string, any> | null>(
    null,
  );
  const [liked, setLiked] = useState<boolean | null>(null);
  const applicationId = useSelector(getCurrentApplicationId);

  const canShowFeedbackForPage = useCallback(
    (pageSlug: string) => {
      if (!appKBState || showSuccessCallout) return false;

      const currentPageKB = appKBState.pageSlugs[pageSlug];

      if (currentPageKB && currentPageKB.hasReacted) return false;

      return true;
    },
    [applicationId, appKBState],
  );

  const currentApplication = useSelector(getCurrentApplication);

  const logFeedback = useCallback(
    (isLiked) => {
      setLiked(isLiked);

      reactToPageKB(applicationId, selectedPage, true);

      AnalyticsUtil.logEvent("AI_KB_FEEDBACK", {
        liked: isLiked,
        app_page_count: currentApplication?.pages.length || 0,
        kb_page_count: getPagesArray(appKb.publishedKB).length,
        selected_preview_page: selectedPage,
      });
    },
    [liked, applicationId, selectedPage],
  );

  useEffect(() => {
    (async () => {
      const appKBStateInDB: Record<string, any> | null = await getAppKbState(
        applicationId,
      );

      setAppKBState(appKBStateInDB);
    })();
  }, [isKBGenerationPending]);

  if (!canShowFeedbackForPage(pageSlug)) return null;

  return (
    <FeedbackContainer className="rounded-t flex px-3 py-[10px] w-full justify-between items-center my-2">
      <Text color="var(--ads-v2-color-gray-600)" kind="heading-xs">
        Did you find this useful?
      </Text>

      <div className="flex">
        <div
          className={classNames("p-1 hover:bg-gray-200 cursor-pointer", {
            "pointer-events-none": liked === true,
            hidden: liked === false,
            "mr-6": isNull(liked),
          })}
          onClick={() => logFeedback(true)}
        >
          <Icon
            color={
              liked === true
                ? "var(--ads-v2-color-fg-success)"
                : "var(--ads-v2-color-fg)"
            }
            name="thumb-up-line"
            size="md"
          />
        </div>
        <div
          className={classNames("p-1 hover:bg-gray-200 cursor-pointer", {
            "pointer-events-none": liked === false,
            hidden: liked === true,
          })}
          onClick={() => logFeedback(false)}
        >
          <Icon
            className="cursor-pointer"
            color={`${
              liked === false
                ? "var(--ads-v2-color-fg-error)"
                : "var(--ads-v2-color-fg)"
            }`}
            name="thumb-down-line"
            size="md"
          />
        </div>
      </div>
    </FeedbackContainer>
  );
};

export default FeedbackCallout;
