import React, { useEffect } from "react";
import clsx from "classnames";
import { Flex, Icon, ScrollArea } from "design-system";

import {
  EditorEntityTab,
  EditorEntityTabState,
  type EntityItem,
} from "@appsmith/entities/IDE/constants";
import {
  StyledTab,
  TabIconContainer,
  TabTextContainer,
} from "./StyledComponents";
import { useCurrentEditorState } from "../hooks";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
  onClose: (actionId?: string) => void;
  currentTab: string;
  newTabClickCallback?: () => void;
}

const FILE_TABS_CONTAINER_ID = "file-tabs-container";

const FileTabs = (props: Props) => {
  const { currentTab, navigateToTab, newTabClickCallback, onClose, tabs } =
    props;
  const { segment, segmentMode } = useCurrentEditorState();

  useEffect(() => {
    const activetab = document.querySelector(".editor-tab.active");
    if (activetab) {
      activetab.scrollIntoView({
        inline: "nearest",
      });
    }
  }, [tabs, segmentMode]);

  useEffect(() => {
    const ele = document.getElementById(FILE_TABS_CONTAINER_ID)?.parentElement;
    if (ele && ele.scrollWidth > ele.clientWidth) {
      ele.style.borderRight = "1px solid var(--ads-v2-color-border)";
    } else if (ele) {
      ele.style.borderRight = "unset";
    }
  }, [tabs]);

  const onCloseClick = (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    onClose(id);
  };

  return (
    <ScrollArea
      className="h-[32px] top-[0.5px]"
      data-testid="t--editor-tabs"
      options={{
        overflow: {
          x: "scroll",
          y: "hidden",
        },
      }}
      size={"sm"}
    >
      <Flex gap="spaces-2" height="100%" id={FILE_TABS_CONTAINER_ID}>
        {tabs.map((tab: EntityItem) => (
          <StyledTab
            className={clsx("editor-tab", currentTab === tab.key && "active")}
            data-testid={`t--ide-tab-${tab.title}`}
            key={tab.key}
            onClick={() => navigateToTab(tab)}
          >
            <TabIconContainer>{tab.icon}</TabIconContainer>
            <TabTextContainer>{tab.title}</TabTextContainer>
            {/* not using button component because of the size not matching design */}
            <Icon
              className="tab-close rounded-[4px] hover:bg-[var(--ads-v2-colors-action-tertiary-surface-hover-bg)] cursor-pointer p-[2px]"
              data-testid="t--tab-close-btn"
              name="close-line"
              onClick={(e) => onCloseClick(e, tab.key)}
            />
          </StyledTab>
        ))}
        {/* New Tab */}
        {segmentMode === EditorEntityTabState.Add ? (
          <StyledTab
            className={clsx("editor-tab", currentTab === "add" && "active")}
            data-testid={`t--ide-tab-new`}
            onClick={newTabClickCallback}
          >
            <TabTextContainer>
              New {segment === EditorEntityTab.JS ? "JS" : "Query"}
            </TabTextContainer>
            {/* not using button component because of the size not matching design */}
            <Icon
              className="tab-close rounded-[4px] hover:bg-[var(--ads-v2-colors-action-tertiary-surface-hover-bg)] cursor-pointer p-[2px]"
              data-testid="t--tab-close-btn"
              name="close-line"
              onClick={(e) => onCloseClick(e)}
            />
          </StyledTab>
        ) : null}
      </Flex>
    </ScrollArea>
  );
};

export default FileTabs;
