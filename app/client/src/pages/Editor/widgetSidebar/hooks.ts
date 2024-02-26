import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getAllTemplates } from "actions/templateActions";
import type { WidgetTags } from "constants/WidgetConstants";
import { widgetCardTagMaxRenderList } from "constants/WidgetConstants";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import {
  getBuildingBlockExplorerCards,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { groupWidgetCardsByTags, setWidgetTagMaxRender } from "../utils";

const getMaxWidgetsPerTag = (): Record<string, boolean> => {
  const maxWidgetsPerTag: Record<string, boolean> = {};

  Object.entries(widgetCardTagMaxRenderList).forEach(([tag, maxValue]) => {
    maxWidgetsPerTag[tag] = !!maxValue;
  });

  return maxWidgetsPerTag;
};

/**
 * Custom hook for managing UI explorer items including widgets and building blocks.
 * @returns Object containing grouped cards, cards with max render list, all cards, show max widgets per tag state, and handle toggle function.
 */
export const useUIExplorerItems = () => {
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const [showMaxWidgetsPerTag, setShowMaxWidgetsPerTag] = useState<
    Record<WidgetTags, boolean>
  >(getMaxWidgetsPerTag());
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );
  const widgetCards = useSelector(getWidgetCards);
  const buildingBlockCards = useSelector(getBuildingBlockExplorerCards);

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    } else {
      setIsLoadingTemplates(false);
    }
  }, [dispatch, templatesCount]);

  const toggleMaxWidgetsPerTag = (tag: WidgetTags): void => {
    setShowMaxWidgetsPerTag((prevState) => ({
      ...prevState,
      [tag]: !prevState[tag],
    }));
  };

  const cards = useMemo(
    () => [
      ...widgetCards,
      ...(releaseDragDropBuildingBlocks ? buildingBlockCards : []),
    ],
    [widgetCards, buildingBlockCards, releaseDragDropBuildingBlocks],
  );

  const groupedCards = useMemo(() => groupWidgetCardsByTags(cards), [cards]);

  const groupedCardsWithMaxRenderPerTag = useMemo(
    () => setWidgetTagMaxRender(groupedCards, showMaxWidgetsPerTag),
    [groupedCards, showMaxWidgetsPerTag],
  );

  return {
    groupedCards,
    groupedCardsWithMaxRenderPerTag,
    cards,
    showMaxWidgetsPerTag,
    toggleMaxWidgetsPerTag,
    isLoadingTemplates,
  };
};
