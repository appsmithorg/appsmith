import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import { getWidgetCards } from "selectors/editorSelectors";
import { SearchInput } from "design-system";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import { debounce } from "lodash";
import {
  createMessage,
  WIDGET_SIDEBAR_CAPTION,
} from "@appsmith/constants/messages";
import Fuse from "fuse.js";
import type { WidgetCardProps } from "widgets/BaseWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getFeatureWalkthroughShown } from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { adaptiveSignpostingEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import {
  actionsExistInCurrentPage,
  widgetsExistCurrentPage,
} from "selectors/entitiesSelector";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { SignpostingWalkthroughConfig } from "./FirstTimeUserOnboarding/Utils";

function WidgetSidebar({ isActive }: { isActive: boolean }) {
  const cards = useSelector(getWidgetCards);
  const [filteredCards, setFilteredCards] = useState(cards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fuse = useMemo(() => {
    const options = {
      keys: [
        {
          name: "displayName",
          weight: 0.9,
        },
        {
          name: "searchTags",
          weight: 0.1,
        },
      ],
      threshold: 0.2,
      distance: 100,
    };

    return new Fuse(cards, options);
  }, [cards]);

  const sendWidgetSearchAnalytics = debounce((value: string) => {
    if (value !== "") {
      AnalyticsUtil.logEvent("WIDGET_SEARCH", { value });
    }
  }, 1000);

  const filterCards = (keyword: string) => {
    sendWidgetSearchAnalytics(keyword);
    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);
      setFilteredCards(searchResult as WidgetCardProps[]);
    } else {
      setFilteredCards(cards);
    }
  };

  useEffect(() => {
    if (isActive) searchInputRef.current?.focus();
  }, [isActive]);

  const search = debounce((value: string) => {
    filterCards(value.toLowerCase());
  }, 300);

  const { pushFeature } = useContext(WalkthroughContext) || {};
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const adaptiveSignposting = useSelector(adaptiveSignpostingEnabled);
  const hasWidgets = useSelector(widgetsExistCurrentPage);
  const actionsExist = useSelector(actionsExistInCurrentPage);
  useEffect(() => {
    async function scrollToTableWidgetCard() {
      const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.add_table_widget,
      );
      const widgetCard = document.getElementById(
        "widget-card-draggable-tablewidgetv2",
      );

      if (!isFeatureWalkthroughShown) {
        widgetCard?.scrollIntoView();
        checkAndShowTableWidgetWalkthrough();
      }
    }
    if (
      signpostingEnabled &&
      !hasWidgets &&
      adaptiveSignposting &&
      isActive &&
      actionsExist
    ) {
      scrollToTableWidgetCard();
    }
  }, [
    isActive,
    hasWidgets,
    signpostingEnabled,
    adaptiveSignposting,
    actionsExist,
  ]);
  const checkAndShowTableWidgetWalkthrough = async () => {
    pushFeature &&
      pushFeature(SignpostingWalkthroughConfig.ADD_TABLE_WIDGET, true);
  };

  return (
    <div
      className={`flex flex-col  overflow-hidden ${isActive ? "" : "hidden"}`}
    >
      <div className="sticky top-0 px-3 mt-0.5">
        <SearchInput
          autoComplete="off"
          autoFocus
          id={ENTITY_EXPLORER_SEARCH_ID}
          onChange={search}
          placeholder="Search widgets"
          ref={searchInputRef}
          type="text"
        />
      </div>
      <div
        className="flex-grow px-3 mt-3 overflow-y-scroll"
        data-testid="widget-sidebar-scrollable-wrapper"
      >
        <p className="px-3 py-3 text-sm leading-relaxed t--widget-sidebar">
          {createMessage(WIDGET_SIDEBAR_CAPTION)}
        </p>
        <div className="grid items-stretch grid-cols-3 gap-3 justify-items-stretch">
          {filteredCards.map((card) => (
            <WidgetCard details={card} key={card.key} />
          ))}
        </div>
      </div>
    </div>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
