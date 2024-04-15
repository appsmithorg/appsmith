import React, { useEffect } from "react";
import { useLocation } from "react-router";
import { useSelector } from "react-redux";
import clsx from "classnames";
import type { FlexProps } from "design-system";
import { Flex, Icon, Tooltip } from "design-system";

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
  const containerProps: FlexProps = isTabsRevampEnabled
    ? { overflowX: "auto", overflowY: "hidden" }
    : {};

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
    <Flex
      data-testid="t--editor-tabs"
      gap="spaces-2"
      height="100%"
      {...containerProps}
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
  );
};

export default FileTabs;
