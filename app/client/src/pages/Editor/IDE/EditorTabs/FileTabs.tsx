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
import { animated, useTransition } from "react-spring";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
}

const FileTabs = (props: Props) => {
  const { navigateToTab, tabs } = props;

  const location = useLocation();

  const currentEntity = identifyEntityFromPath(location.pathname);

  const transitions = useTransition(tabs, {
    from: { transform: "translateX(-100%)", opacity: 0 },
    enter: { transform: "translateX(0)", opacity: 1 },
    leave: { transform: "translateX(100%)", opacity: 0 },
    unique: true,
    trail: 200,
    keys: (item) => item.key,
  });

  return (
    <Flex data-testId="editor-tabs" flex="1" gap="spaces-2" height="100%">
      {transitions((style, tab) => (
        <animated.div style={style}>
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
        </animated.div>
      ))}
    </Flex>
  );
};

export default FileTabs;
