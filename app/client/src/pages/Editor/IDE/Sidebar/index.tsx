import React, { useCallback, useState } from "react";
import {
  getIsAppSidebarAnnouncementEnabled,
  getIsAppSidebarEnabled,
} from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import { ButtonButtons, TopButtons } from "entities/IDE/constants";
import useCurrentAppState from "../hooks";
import {
  AnnouncementPopover,
  AnnouncementPopoverTrigger,
  AnnouncementPopoverContent,
  Button,
} from "design-system";

const Container = styled.div`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
  position: relative;
`;

const DummyTrigger = styled.div`
  width: 0;
  height: 0;
  position: absolute;
  right: 0;
  top: 10%;
`;

function Sidebar() {
  const appState = useCurrentAppState();
  const [isPopoverOpen, setIsPopoverOpen] = useState(true);
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  const isAppSidebarAnnouncementEnabled = useSelector(
    getIsAppSidebarAnnouncementEnabled,
  );
  const isAppSidebarAnnouncementDismissed =
    localStorage.getItem("isAppSidebarAnnouncementDismissed") === "true";
  const pageId = useSelector(getCurrentPageId);
  const onClick = useCallback(
    (suffix) => {
      history.push(
        builderURL({
          pageId,
          suffix,
        }),
        {
          invokedBy: NavigationMethod.AppSidebar,
        },
      );
    },
    [pageId],
  );
  if (!isAppSidebarEnabled) {
    return null;
  }

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    localStorage.setItem(
      "isAppSidebarAnnouncementDismissed",
      JSON.stringify(true),
    );
  };

  return (
    <Container>
      {isAppSidebarAnnouncementEnabled &&
        !isAppSidebarAnnouncementDismissed && (
          <AnnouncementPopover open={isPopoverOpen}>
            <AnnouncementPopoverTrigger>
              <DummyTrigger className="sidebar-popover-trigger" />
            </AnnouncementPopoverTrigger>
            <AnnouncementPopoverContent
              align="center"
              arrowFillColor="#F6F2FA"
              banner="https://assets.appsmith.com/new-sidebar-banner.svg"
              collisionPadding={{ top: 20 }}
              description="Navigate faster through datasources, pages, and app settings."
              footer={
                <Button kind="primary" onClick={handlePopoverClose} size="md">
                  Got it
                </Button>
              }
              onCloseButtonClick={handlePopoverClose}
              side="right"
              title="App-level items have a new home!"
            />
          </AnnouncementPopover>
        )}
      <div>
        {TopButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => onClick(b.urlSuffix)}
            selected={appState === b.state}
            title={b.title}
          />
        ))}
      </div>
      <div>
        {ButtonButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => onClick(b.urlSuffix)}
            selected={appState === b.state}
            tooltip={b.title}
          />
        ))}
      </div>
    </Container>
  );
}

export default Sidebar;
