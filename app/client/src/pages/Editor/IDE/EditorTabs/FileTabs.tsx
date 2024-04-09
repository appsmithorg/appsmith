import React, { useEffect } from "react";
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

  useEffect(() => {
    const activetab = document.querySelector(".editor-tab.active");
    if (activetab) {
      activetab.scrollIntoView({
        inline: "nearest",
      });
    }
  }, [tabs]);

  return (
    <Flex
      data-testid="t--editor-tabs"
      gap="spaces-2"
      height="100%"
      overflowX="auto"
      overflowY="hidden"
    >
      {tabs.map((tab: EntityItem) => (
        <StyledTab
          className={clsx(
            "editor-tab",
            currentEntity.id === tab.key && "active",
          )}
          data-testid={`t--ide-tab-${tab.title}`}
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
