import React from "react";
import { Flex } from "design-system";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { useLocation } from "react-router";
import clsx from "classnames";
import { StyledTab } from "./StyledComponents";
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
    <Flex
      className="editor-tabs"
      flex="1"
      gap="spaces-2"
      overflow="hidden"
      paddingBottom="spaces-2"
    >
      {tabs.map((tab: EntityItem) => (
        <StyledTab
          className={clsx(
            "editor-tab",
            currentEntity.id === tab.key && "active",
          )}
          key={tab.key}
          onClick={() => navigateToTab(tab)}
        >
          {tab.title}
        </StyledTab>
      ))}
    </Flex>
  );
};

export default FileTabs;
