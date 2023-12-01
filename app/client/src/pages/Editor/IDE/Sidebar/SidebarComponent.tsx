import React, { useState } from "react";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import type { SidebarButton as SidebarButtonType } from "entities/IDE/constants";
import {
  AnnouncementPopover,
  AnnouncementPopoverTrigger,
  AnnouncementPopoverContent,
  Button,
} from "design-system";
import { useIsAppSidebarEnabled } from "../../../../navigation/featureFlagHooks";

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

interface SidebarComponentProps {
  topButtons: SidebarButtonType[];
  bottomButtons: SidebarButtonType[];
  appState: string;
  onClick: (suffix: string) => void;
  isAppSidebarAnnouncementEnabled: boolean;
}

function SidebarComponent(props: SidebarComponentProps) {
  const {
    appState,
    bottomButtons,
    isAppSidebarAnnouncementEnabled,
    onClick,
    topButtons,
  } = props;
  const [isPopoverOpen, setIsPopoverOpen] = useState(true);
  const isAppSidebarEnabled = useIsAppSidebarEnabled();
  const isAppSidebarAnnouncementDismissed =
    localStorage.getItem("isAppSidebarAnnouncementDismissed") === "true";

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    localStorage.setItem(
      "isAppSidebarAnnouncementDismissed",
      JSON.stringify(true),
    );
  };

  if (!isAppSidebarEnabled) {
    return null;
  }

  return (
    <Container className="t--sidebar" id="t--app-sidebar">
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
        {topButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => {
              if (appState !== b.state) {
                onClick(b.urlSuffix);
              }
            }}
            selected={appState === b.state}
            title={b.title}
          />
        ))}
      </div>
      <div>
        {bottomButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => {
              if (appState !== b.state) {
                onClick(b.urlSuffix);
              }
            }}
            selected={appState === b.state}
            tooltip={b.title}
          />
        ))}
      </div>
    </Container>
  );
}

export default SidebarComponent;
