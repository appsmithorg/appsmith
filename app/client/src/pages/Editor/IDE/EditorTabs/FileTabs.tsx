import React from "react";
import { Flex, Tooltip } from "design-system";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { useLocation } from "react-router";
import clsx from "classnames";
import {
  StyledTab,
  TabIconContainer,
  TabTextContainer,
} from "./StyledComponents";
import { identifyEntityFromPath } from "navigation/FocusEntity";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
}

const FileTabs = (props: Props) => {
  const { navigateToTab, tabs } = props;

  const location = useLocation();

  const currentEntity = identifyEntityFromPath(location.pathname);

  return (
    <Flex data-testid="editor-tabs" flex="1" gap="spaces-2" height="100%">
      {tabs.map((tab: EntityItem) => (
        <StyledTab
          className={clsx(
            "editor-tab",
            currentEntity.id === tab.key && "active",
          )}
          key={tab.key}
          onClick={() => navigateToTab(tab)}
        >
          <TabIconContainer>{tab.icon}</TabIconContainer>
          <Tooltip content={tab.title} mouseEnterDelay={1}>
            <TabTextContainer>{tab.title}</TabTextContainer>
          </Tooltip>
        </StyledTab>
      ))}
    </Flex>
  );
};

export default FileTabs;
