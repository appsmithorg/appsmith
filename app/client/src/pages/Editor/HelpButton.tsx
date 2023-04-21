import React, { useEffect } from "react";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import bootIntercom from "utils/bootIntercom";
import {
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  HELP_RESOURCE_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import moment from "moment/moment";
import styled from "styled-components";

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--ads-v2-color-border);
  padding: 5px 10px;
  height: 30px;
  color: var(--ads-v2-color-fg);
  font-size: 6pt;
`;
type HelpItem = {
  label: string;
  link?: string;
  id?: string;
  icon: string;
};

const HELP_MENU_ITEMS: HelpItem[] = [
  {
    icon: "file-line",
    label: "Documentation",
    link: "https://docs.appsmith.com/",
  },
  {
    icon: "bug",
    label: "Report a bug",
    link: "https://github.com/appsmithorg/appsmith/issues/new/choose",
  },
  {
    icon: "discord",
    label: "Join our Discord",
    link: "https://discord.gg/rBTTVJp",
  },
];

if (intercomAppID && window.Intercom) {
  HELP_MENU_ITEMS.push({
    icon: "chat-help",
    label: "Chat with us",
    id: "intercom-trigger",
  });
}

function HelpButton() {
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <Tooltip content={createMessage(HELP_RESOURCE_TOOLTIP)} placement="bottom">
      <Menu
        onOpenChange={(open) => {
          if (open) {
            AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
          }
        }}
      >
        <MenuTrigger>
          <Button kind="tertiary" size="md" startIcon="question-line">
            Help
          </Button>
        </MenuTrigger>
        <MenuContent collisionPadding={10}>
          <div style={{ width: HELP_MODAL_WIDTH }}>
            {HELP_MENU_ITEMS.map((item) => (
              <MenuItem
                endIcon="share-box-line"
                key={item.label}
                onClick={() => {
                  if (item.link) window.open(item.link, "_blank");
                  if (item.id === "intercom-trigger") {
                    if (intercomAppID && window.Intercom) {
                      window.Intercom("show");
                    }
                  }
                }}
                startIcon={item.icon}
              >
                {item.label}
              </MenuItem>
            ))}
            {appVersion.id && (
              <HelpFooter>
                <span>
                  {createMessage(
                    APPSMITH_DISPLAY_VERSION,
                    appVersion.edition,
                    appVersion.id,
                    cloudHosting,
                  )}
                </span>
                <span>Released {moment(appVersion.releaseDate).fromNow()}</span>
              </HelpFooter>
            )}
          </div>
        </MenuContent>
      </Menu>
    </Tooltip>
  );
}

export default HelpButton;
