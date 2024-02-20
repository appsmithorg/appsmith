import {
  WIDGET_PANEL_EMPTY_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import { getAllTemplates } from "actions/templateActions";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import {
  INITIAL_BUILDING_BLOCKS_IN_EXPLORER,
  SUGGESTED_WIDGETS_ORDER,
  WIDGET_TAGS,
  type WidgetCardsGroupedByTags,
  type WidgetTags,
} from "constants/WidgetConstants";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  SearchInput,
  Text,
} from "design-system";
import Fuse from "fuse.js";
import { debounce, sortBy } from "lodash";
import { TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE } from "pages/Templates/constants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import {
  getTemplatesSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { WidgetCardProps } from "widgets/BaseWidget";
import BuildingBlockExplorerCard from "./BuildingBlockExplorerCard";
import WidgetCard from "./WidgetCard";
import {
  groupWidgetCardsByTags,
  transformTemplatesToWidgetCard,
} from "../utils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

function WidgetSidebarWithTags({ isActive }: { isActive: boolean }) {
  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );
  const dispatch = useDispatch();
  const [buildingBlockInitList, setBuildingBlockInitList] = useState(
    INITIAL_BUILDING_BLOCKS_IN_EXPLORER,
  );
  const templatesCount = useSelector(templatesCountSelector);
  const buildingBlocks = useSelector(getTemplatesSelector).filter(
    (template) =>
      template.functions[0] === TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  );
  const widgetCards = useSelector(getWidgetCards);
  const buildingBlockCards = releaseDragDropBuildingBlocks
    ? transformTemplatesToWidgetCard(buildingBlocks)
    : [];
  const cards = [
    ...widgetCards,
    ...buildingBlockCards.slice(0, buildingBlockInitList),
  ];
  const groupedCards = useMemo(() => groupWidgetCardsByTags(cards), [cards]);
  const [filteredCards, setFilteredCards] =
    useState<WidgetCardsGroupedByTags>(groupedCards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const SEE_MORE_LESS_TEXT =
    buildingBlockInitList === INITIAL_BUILDING_BLOCKS_IN_EXPLORER
      ? "See more"
      : "See less";
  const SEE_MORE_ARROW =
    buildingBlockInitList === INITIAL_BUILDING_BLOCKS_IN_EXPLORER
      ? "arrow-down-s-line"
      : "arrow-up-s-line";

  const searchWildcards = useMemo(() => {
    return cards
      .filter((card) => card.isSearchWildcard)
      .map((card) => ({
        ...card,
        tags: [WIDGET_TAGS.SUGGESTED_WIDGETS],
      }));
  }, [cards]);

  const fuse = useMemo(() => {
    const options = {
      keys: [
        {
          name: "displayName",
          weight: 0.8,
        },
        {
          name: "searchTags",
          weight: 0.1,
        },
        {
          name: "tags",
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
    setIsSearching(true);
    sendWidgetSearchAnalytics(keyword);

    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);

      if (searchResult.length > 0) {
        setFilteredCards(groupWidgetCardsByTags(searchResult));
      } else {
        setFilteredCards(groupWidgetCardsByTags(searchWildcards));
      }

      setIsEmpty(searchResult.length === 0);
    } else {
      setFilteredCards(groupedCards);
      setIsSearching(false);
      setIsEmpty(false);
    }
  };

  const search = debounce((value: string) => {
    filterCards(value.toLowerCase());
  }, 300);

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    } else {
      setFilteredCards(groupedCards);
    }
  }, [templatesCount, buildingBlockInitList]);

  return (
    <div
      className={`flex flex-col t--widget-sidebar overflow-hidden ${
        isActive ? "" : "hidden"
      }`}
    >
      <div className="sticky top-0 px-3 mt-0.5">
        <SearchInput
          autoComplete="off"
          id={ENTITY_EXPLORER_SEARCH_ID}
          onChange={search}
          placeholder="Search widgets"
          ref={searchInputRef}
          type="text"
        />
      </div>
      <div
        className="flex-grow px-3 mt-2 overflow-y-scroll"
        data-testid="widget-sidebar-scrollable-wrapper"
      >
        {isEmpty && (
          <Text
            color="#6A7585"
            kind="body-m"
            renderAs="p"
            style={{ marginBottom: "15px" }}
          >
            {createMessage(WIDGET_PANEL_EMPTY_MESSAGE)} `
            {searchInputRef.current?.value}`
          </Text>
        )}
        <div>
          {Object.keys(filteredCards).map((tag) => {
            const cardsForThisTag: WidgetCardProps[] =
              filteredCards[tag as WidgetTags];

            if (!cardsForThisTag?.length) {
              return null;
            }

            // We don't need to show suggested widgets when the user is searching
            if (
              isSearching &&
              tag === WIDGET_TAGS.SUGGESTED_WIDGETS &&
              !isEmpty
            ) {
              return null;
            }

            return (
              <Collapsible
                className={`pb-2 widget-tag-collapisble widget-tag-collapisble-${tag
                  .toLowerCase()
                  .replace(/ /g, "-")}`}
                isOpen
                key={tag}
              >
                <CollapsibleHeader arrowPosition="start">
                  <Text
                    className="select-none"
                    color="var(--ads-v2-color-gray-600)"
                    kind="heading-xs"
                  >
                    {tag}
                  </Text>
                </CollapsibleHeader>

                <CollapsibleContent>
                  <div className="grid items-stretch grid-cols-3 gap-x-2 gap-y-1 justify-items-stretch">
                    {tag === WIDGET_TAGS.SUGGESTED_WIDGETS
                      ? sortBy(cardsForThisTag, (widget) => {
                          return SUGGESTED_WIDGETS_ORDER[widget.type];
                        }).map((card) => (
                          <WidgetCard details={card} key={card.key} />
                        ))
                      : cardsForThisTag.map((card) => {
                          if (card.type === "BUILDING_BLOCK") {
                            return (
                              <BuildingBlockExplorerCard
                                details={card}
                                key={card.key}
                              />
                            );
                          } else {
                            return <WidgetCard details={card} key={card.key} />;
                          }
                        })}
                  </div>

                  {tag === WIDGET_TAGS.BUILDING_BLOCKS && (
                    <Button
                      className="mt-4"
                      data-testid="t--canvas-building-block-see-more"
                      kind="tertiary"
                      onClick={() => {
                        if (
                          buildingBlockInitList ===
                          INITIAL_BUILDING_BLOCKS_IN_EXPLORER
                        ) {
                          setBuildingBlockInitList(buildingBlocks.length);
                        } else {
                          setBuildingBlockInitList(
                            INITIAL_BUILDING_BLOCKS_IN_EXPLORER,
                          );
                        }
                      }}
                      size="md"
                      startIcon={SEE_MORE_ARROW}
                    >
                      {SEE_MORE_LESS_TEXT}
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}

WidgetSidebarWithTags.displayName = "WidgetSidebarWithTags";

export default WidgetSidebarWithTags;
