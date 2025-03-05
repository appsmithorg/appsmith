import React, { Fragment } from "react";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import type { Page } from "entities/Page";
import { ListItemContainer } from "@appsmith/ads";
import { PageElement as OldPageEntity } from "./OldPageEntity";
import { PageEntity } from "./PageEntity";

interface PageListProps {
  pages: Page[];
  onItemSelected: () => void;
}

export const PageList = ({ onItemSelected, pages }: PageListProps) => {
  const isNewADSEnabled = useFeatureFlag(
    FEATURE_FLAG.release_ads_entity_item_enabled,
  );

  if (!isNewADSEnabled) {
    return (
      <>
        {pages.map((page) => (
          <ListItemContainer key={page.pageId}>
            <OldPageEntity onClick={onItemSelected} page={page} />
          </ListItemContainer>
        ))}
      </>
    );
  }

  return (
    <>
      {pages.map((page) => (
        <PageEntity key={page.pageId} onClick={onItemSelected} page={page} />
      ))}
    </>
  );
};
