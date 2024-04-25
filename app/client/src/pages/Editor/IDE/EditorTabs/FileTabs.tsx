import React, { useEffect } from "react";
import { useLocation } from "react-router";
import { useSelector } from "react-redux";
import clsx from "classnames";
import { Flex, Icon, ScrollArea, Tooltip } from "design-system";

import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  StyledTab,
  TabIconContainer,
  TabTextContainer,
} from "./StyledComponents";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { getIsTabsRevampEnabled } from "selectors/ideSelectors";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
  onClose: (actionId: string) => void;
}

const FileTabs = (props: Props) => {
  const { navigateToTab, onClose, tabs } = props;
  const isTabsRevampEnabled = useSelector(getIsTabsRevampEnabled);

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

  const onCloseClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onClose(id);
  };

  return (
    <ScrollArea
      className="h-[32px]"
      data-testid="t--editor-tabs"
      options={
        isTabsRevampEnabled
          ? {
              overflow: {
                x: "scroll",
                y: "hidden",
              },
            }
          : {
              overflow: {
                x: "hidden",
                y: "hidden",
              },
            }
      }
      size={"sm"}
    >
      <Flex gap="spaces-2" height="100%">
        {tabs.map((tab: EntityItem) => (
          <StyledTab
            className={clsx(
              "editor-tab",
              currentEntity.id === tab.key && "active",
            )}
            data-testid={`t--ide-tab-${tab.title}`}
            key={tab.key}
            onClick={() => navigateToTab(tab)}
            showOverflow={isTabsRevampEnabled}
          >
            <TabIconContainer>{tab.icon}</TabIconContainer>
            <Tooltip content={tab.title} mouseEnterDelay={1}>
              <TabTextContainer>{tab.title}</TabTextContainer>
            </Tooltip>
            {/* not using button component because of the size not matching design */}
            {isTabsRevampEnabled ? (
              <Icon
                className="tab-close rounded-[4px] hover:bg-[var(--ads-v2-colors-action-tertiary-surface-hover-bg)] cursor-pointer p-[2px]"
                data-testid="t--tab-close-btn"
                name="close-line"
                onClick={(e) => onCloseClick(e, tab.key)}
              />
            ) : null}
          </StyledTab>
        ))}
      </Flex>
    </ScrollArea>
  );
};

export default FileTabs;
