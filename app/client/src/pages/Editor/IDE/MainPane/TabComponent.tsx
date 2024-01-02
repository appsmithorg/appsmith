import React from "react";
import styled from "styled-components";
import clsx from "classnames";
import { Flex } from "design-system";
import { useSelector } from "react-redux";

import { EditorEntityTab } from "entities/IDE/constants";
import type { PagePaneDataObject } from "@appsmith/selectors/entitiesSelector";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import {
  selectJSForPagespane,
  selectQueriesForPagespane,
} from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history, { NavigationMethod } from "utils/history";

const StyledTab = styled(Flex)`
  border-radius: var(--ads-v2-border-radius);
  padding: 4px 12px;
  font-size: 12px;
  color: var(--ads-v2-colors-text-default);
  cursor: pointer;
  &.active {
    background-color: var(--ads-v2-colors-control-knob-default-bg);
    color: var(--ads-v2-colors-text-default);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12);
  }
`;

const TabComponent = ({ segment }: { segment: EditorEntityTab }) => {
  const activeActionId = useActiveAction();
  const pageId = useSelector(getCurrentPageId);

  const files = useSelector((state) =>
    segment === EditorEntityTab.JS
      ? selectJSForPagespane(state)
      : selectQueriesForPagespane(state),
  );

  // convert files object to array
  const tabs: PagePaneDataObject[] = [];
  Object.keys(files).forEach((key) => {
    tabs.push(...files[key]);
  });

  const navigateToJSCollection = (id: string, name: string) => {
    const navigateToUrl = jsCollectionIdURL({
      pageId,
      collectionId: id,
      params: {},
    });

    AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
      type: "JSOBJECT",
      fromUrl: location.pathname,
      toUrl: navigateToUrl,
      name: name,
    });
    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EditorTabs,
    });
  };

  return (
    <Flex
      className="editor-tabs"
      flex="1"
      gap="spaces-2"
      overflow="hidden"
      paddingBottom="spaces-2"
    >
      {tabs.map((tab: any) => {
        return (
          <StyledTab
            className={clsx(
              "editor-tab",
              activeActionId === tab.id && "active",
            )}
            key={tab.id}
            onClick={() =>
              segment === EditorEntityTab.JS
                ? navigateToJSCollection(tab.id, tab.name)
                : null
            }
          >
            {tab.name}
          </StyledTab>
        );
      })}
    </Flex>
  );
};

export { TabComponent };
