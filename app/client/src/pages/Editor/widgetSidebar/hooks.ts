import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getAllTemplates } from "actions/templateActions";
import { getCustomBB } from "actions/widgetActions";
import type { WidgetTags } from "constants/WidgetConstants";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import { isFixedLayoutSelector } from "selectors/layoutSystemSelectors";
import {
  getBuildingBlockExplorerCards,
  getCustomBuildingBlockExplorerCards,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { groupWidgetCardsByTags } from "../utils";

/**
 * Custom hook for managing UI explorer items including widgets and building blocks.
 * @returns Object containing cards, grouped cards and entity loading states.
 */
export const useUIExplorerItems = () => {
  const releaseDragDropBuildingBlocks = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );
  const isFixedLayout = useSelector(isFixedLayoutSelector);
  const dispatch = useDispatch();
  // check if entities have loaded
  const isBuildingBlocksLoaded = useSelector(templatesCountSelector) > 0;

  const [entityLoading, setEntityLoading] = useState<
    Partial<Record<WidgetTags, boolean>>
  >({
    "Building Blocks": releaseDragDropBuildingBlocks
      ? !isBuildingBlocksLoaded
      : false,
  });
  const widgetCards = useSelector(getWidgetCards);
  const buildingBlockCards = useSelector(getBuildingBlockExplorerCards);
  const customBBs = useSelector(getCustomBuildingBlockExplorerCards);

  useEffect(() => {
    dispatch(getCustomBB());
  }, []);

  useEffect(() => {
    if (customBBs.length) {
      setEntityLoading((prev) => ({ ...prev, "Building Blocks": false }));
    }
  }, [customBBs]);

  // handle loading async entities
  useEffect(() => {
    if (
      !isBuildingBlocksLoaded &&
      releaseDragDropBuildingBlocks &&
      isFixedLayout
    ) {
      dispatch(getAllTemplates());
    } else {
      setEntityLoading((prev) => ({ ...prev, "Building Blocks": false }));
    }
  }, [isBuildingBlocksLoaded, releaseDragDropBuildingBlocks, isFixedLayout]);

  const cards = useMemo(
    () => [
      ...widgetCards,
      ...(isFixedLayout && releaseDragDropBuildingBlocks
        ? buildingBlockCards
        : []),
      ...customBBs,
    ],
    [
      widgetCards,
      buildingBlockCards,
      releaseDragDropBuildingBlocks,
      isFixedLayout,
      customBBs,
    ],
  );

  const groupedCards = useMemo(() => groupWidgetCardsByTags(cards), [cards]);

  return {
    groupedCards,
    cards,
    entityLoading,
  };
};
